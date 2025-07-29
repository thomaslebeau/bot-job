import dotenv from "dotenv";
import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ChannelType,
} from "discord.js";
import cron from "node-cron";
import {
  getReddit,
  getRedditForced,
  detectProjectStatus,
} from "./getReddit.js";
import { generateResponse } from "./responseTemplates.js";
import {
  addOpportunityToSheet,
  initSpreadsheet,
  getNewOpportunities,
  updateOpportunityStatus,
  autoCloseFoundOpportunities,
  autoCloseFoundOpportunitiesEnhanced,
} from "./googleSheets.js";
import { sendMorningReport, sendUrgentAlert } from "./emailService.js";
import {
  analyzeJobWithAI,
  testGroqConnection,
  getGroqUsageStats,
  resetGroqStats,
  getDailyStatsReport,
} from "./aiAnalyzer.js";

dotenv.config();

const red_color = 0xff0000;
const green_color = 0x00ff00;
const blue_color = 0x0099ff;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Configuration des channels
let channelIds = {
  reddit: null,
  status: null,
};

const redditCard = (
  title,
  url,
  subreddit,
  relevanceScore = 0,
  description = "",
  numComments = 0,
  hoursAgo = 0
) => {
  // Extraire le budget s'il est visible dans le titre ou description
  const fullText = title + " " + description;
  const budgetMatch = fullText.match(/\$(\d+(?:,\d+)?(?:\.\d+)?)/);
  const budget = budgetMatch ? `💰 Budget: $${budgetMatch[1]}` : "";

  // Déterminer l'emoji de priorité selon le score
  let priorityEmoji = "";
  let priorityText = "";

  if (relevanceScore >= 18) {
    priorityEmoji = "🔥";
    priorityText = "**🐲 CREATURE DESIGN MATCH!**";
  } else if (relevanceScore >= 15) {
    priorityEmoji = "🔥";
    priorityText = "**MATCH PARFAIT**";
  } else if (relevanceScore >= 10) {
    priorityEmoji = "⭐";
    priorityText = "**TRÈS PERTINENT**";
  } else if (relevanceScore >= 5) {
    priorityEmoji = "✨";
    priorityText = "**PERTINENT**";
  }

  // Analyser la fraîcheur et concurrence
  let timeEmoji = "";
  let timeText = "";
  let competitionEmoji = "";
  let competitionText = "";

  // Analyse temporelle
  if (hoursAgo <= 1) {
    timeEmoji = "🚨";
    timeText = "**TRÈS RÉCENT**";
  } else if (hoursAgo <= 6) {
    timeEmoji = "🕐";
    timeText = "**RÉCENT**";
  } else if (hoursAgo <= 24) {
    timeEmoji = "📅";
    timeText = "Aujourd'hui";
  } else if (hoursAgo <= 48) {
    timeEmoji = "📅";
    timeText = "Hier";
  } else {
    const daysAgo = Math.floor(hoursAgo / 24);
    timeEmoji = "📅";
    timeText = `Il y a ${daysAgo} jour${daysAgo > 1 ? "s" : ""}`;
  }

  // Analyse de la concurrence
  if (numComments === 0) {
    competitionEmoji = "✅";
    competitionText = "**AUCUN CONCURRENT**";
  } else if (numComments <= 30) {
    competitionEmoji = "⚠️";
    competitionText = "**PEU DE CONCURRENCE**";
  } else if (numComments <= 70) {
    competitionEmoji = "🟡";
    competitionText = "**CONCURRENCE MODÉRÉE**";
  } else {
    competitionEmoji = "🔴";
    competitionText = "**FORTE CONCURRENCE**";
  }

  // Extraire un extrait pertinent de la description
  let descriptionExtract = "";
  if (description) {
    const keywordSentences = [];
    const sentences = description.split(/[.!?]+/);

    const importantKeywords = [
      "creature",
      "monster",
      "beast",
      "dragon",
      "demon",
      "design",
      "concept",
      "character",
      "dnd",
      "d&d",
      "style",
      "semi",
      "stylized",
      "fantasy",
      "budget",
      "looking for",
      "need",
      "commission",
      "reference",
      "anatomy",
    ];

    for (const sentence of sentences) {
      if (sentence.length > 20 && sentence.length < 150) {
        for (const keyword of importantKeywords) {
          if (sentence.toLowerCase().includes(keyword)) {
            keywordSentences.push(sentence.trim());
            break;
          }
        }
      }
    }

    if (keywordSentences.length > 0) {
      descriptionExtract =
        "\n📝 *" + keywordSentences[0].substring(0, 120) + "...*";
    }
  }

  const descriptionContent = [
    `**Subreddit:** r/${subreddit}`,
    budget,
    priorityText ? `${priorityEmoji} ${priorityText}` : "",
    `${timeEmoji} **Posté:** ${timeText} (${hoursAgo}h)`,
    `${competitionEmoji} **Commentaires:** ${numComments} ${competitionText}`,
    descriptionExtract,
    `\n[👀 Voir l'annonce complète](${url})`,
  ]
    .filter(Boolean)
    .join("\n");

  // Couleur basée sur urgence ET pertinence
  let cardColor = red_color;
  if (relevanceScore >= 10 && hoursAgo <= 6) {
    cardColor = 0xff6b00; // Orange vif pour "urgent et pertinent"
  } else if (relevanceScore >= 10) {
    cardColor = green_color; // Vert pour "très pertinent"
  } else if (hoursAgo <= 2) {
    cardColor = 0xffff00; // Jaune pour "très récent"
  }

  return new EmbedBuilder()
    .setColor(cardColor)
    .setTitle(
      `${priorityEmoji} ` +
        (title.length > 160 ? title.substring(0, 160) + "..." : title)
    )
    .setURL(url)
    .setDescription(descriptionContent)
    .setTimestamp()
    .setFooter({
      text: `Reddit • r/${subreddit} • Score: ${relevanceScore} • ${numComments} commentaires`,
    });
};

const statusCard = (message, type = "info") => {
  const colors = {
    info: blue_color,
    success: green_color,
    error: red_color,
  };

  return new EmbedBuilder()
    .setColor(colors[type])
    .setTitle(`🤖 Bot Status - ${type.toUpperCase()}`)
    .setDescription(message)
    .setTimestamp();
};

// Fonction pour créer les channels nécessaires
const setupChannels = async (guild) => {
  try {
    console.log("🔧 Configuration des channels...");

    // Créer la catégorie principale
    let category = guild.channels.cache.find(
      (c) =>
        c.name === "🎨 ART JOBS BOT" && c.type === ChannelType.GuildCategory
    );

    if (!category) {
      category = await guild.channels.create({
        name: "🎨 ART JOBS BOT",
        type: ChannelType.GuildCategory,
      });
      console.log("✅ Catégorie créée");
    }

    // Créer les channels
    const channelsToCreate = [
      { name: "reddit-art-jobs", key: "reddit", emoji: "🎨" },
      { name: "bot-status", key: "status", emoji: "📊" },
    ];

    for (const channelConfig of channelsToCreate) {
      let channel = guild.channels.cache.find(
        (c) => c.name === channelConfig.name
      );

      if (!channel) {
        channel = await guild.channels.create({
          name: channelConfig.name,
          type: ChannelType.GuildText,
          parent: category.id,
          topic: `${channelConfig.emoji} Notifications automatiques pour les offres d'art Reddit`,
        });
        console.log(`✅ Channel #${channelConfig.name} créé`);
      }

      channelIds[channelConfig.key] = channel.id;
    }

    // Envoyer un message de bienvenue
    const statusChannel = guild.channels.cache.get(channelIds.status);
    if (statusChannel) {
      await statusChannel.send({
        embeds: [
          statusCard(
            "🚀 Bot Art Jobs démarré avec succès!\n\n**🐲 SPÉCIALITÉ: CREATURE DESIGN**\n\n**Surveillance Reddit active:**\n• HungryArtists\n• artcommissions\n• starvingartists\n• hireanartist\n\n**Styles ciblés:**\n• Semi-réaliste ✨\n• Stylisé 🎨\n• Concept art 📝\n\n**Nouvelles fonctionnalités:**\n📊 Google Sheets intégré (source unique)\n📧 Rapport matinal à 8h\n🚨 Alertes urgentes\n🔄 Gestion doublons automatique\n\n**Vérification:** Toutes les heures ⏰",
            "success"
          ),
        ],
      });
    }

    return true;
  } catch (error) {
    console.error("❌ Erreur lors de la configuration:", error);
    return false;
  }
};

// Fonction pour traiter et poster les nouvelles opportunités
const processOpportunities = async (newJobs, guild) => {
  if (!newJobs || newJobs.length === 0) return 0;

  const redditChannel = guild.channels.cache.get(channelIds.reddit);
  if (!redditChannel) return 0;

  let processedCount = 0;
  let closedCount = 0;
  let inProgressCount = 0;

  for (const job of newJobs) {
    try {
      // 🆕 VÉRIFIER SI LE PROJET EST FERMÉ
      const mockSubmission = {
        title: job.title,
        selftext: job.description || "",
        link_flair_text: job.flair || "",
      };

      const projectStatus = detectProjectStatus(mockSubmission);

      // 🆕 VÉRIFIER SI LE PROJET EST SUPPRIMÉ
      if (projectStatus.isDeleted) {
        console.log(
          `🗑️ Projet supprimé détecté: ${job.title.substring(0, 50)}... (${
            projectStatus.reason
          })`
        );

        const subredditMatch = job.url.match(/\/r\/([^/]+)\//);
        const subreddit = subredditMatch ? subredditMatch[1] : "unknown";

        const opportunityData = {
          ...job,
          subreddit: subreddit,
        };

        const sheetResult = await addOpportunityToSheet(opportunityData);

        if (sheetResult === "added") {
          // Marquer comme supprimé
          await updateOpportunityStatus(job.url, "FERMÉ", projectStatus.reason);
          closedCount++;
        }

        // Poster dans Discord avec indication "supprimé"
        await redditChannel.send({
          embeds: [
            redditCard(
              `🗑️ [SUPPRIMÉ] ${job.title}`,
              job.url,
              subreddit,
              job.relevanceScore,
              job.description,
              job.numComments,
              job.hoursAgo
            ).setColor(0x666666), // Gris foncé pour les projets supprimés
          ],
        });

        const deleteReason = projectStatus.details.deletedByUser
          ? "utilisateur"
          : "modérateurs";

        await redditChannel.send(
          `**🗑️ Post supprimé par ${deleteReason}**\n` +
            `*Opportunité marquée comme supprimée dans Google Sheets*`
        );

        continue; // Passer au job suivant
      }

      if (projectStatus.isClosed) {
        console.log(
          `🔒 Projet fermé détecté: ${job.title.substring(0, 50)}... (${
            projectStatus.reason
          })`
        );

        // Ajouter à Google Sheets avec statut fermé
        const subredditMatch = job.url.match(/\/r\/([^/]+)\//);
        const subreddit = subredditMatch ? subredditMatch[1] : "unknown";

        const opportunityData = {
          ...job,
          subreddit: subreddit,
        };

        const sheetResult = await addOpportunityToSheet(opportunityData);

        if (sheetResult === "added") {
          // Immédiatement marquer comme fermé
          await updateOpportunityStatus(job.url, "FERMÉ", projectStatus.reason);
          closedCount++;
        }

        // Poster dans Discord avec indication "fermé"
        await redditChannel.send({
          embeds: [
            redditCard(
              `🔒 [FERMÉ] ${job.title}`,
              job.url,
              subreddit,
              job.relevanceScore,
              job.description,
              job.numComments,
              job.hoursAgo
            ).setColor(0x888888), // Gris pour les projets fermés
          ],
        });

        await redditChannel.send(
          `**🔒 Projet fermé détecté** (${projectStatus.reason})\n` +
            `*Cette opportunité a été automatiquement marquée comme fermée dans Google Sheets*`
        );

        continue; // Passer au job suivant
      }

      // 🆕 VÉRIFIER SI LE PROJET EST EN COURS DE RÉVISION
      if (projectStatus.isInProgress) {
        console.log(
          `📋 Projet en cours détecté: ${job.title.substring(0, 50)}... (${
            projectStatus.reason
          })`
        );

        const subredditMatch = job.url.match(/\/r\/([^/]+)\//);
        const subreddit = subredditMatch ? subredditMatch[1] : "unknown";

        const opportunityData = {
          ...job,
          subreddit: subreddit,
        };

        const sheetResult = await addOpportunityToSheet(opportunityData);

        if (sheetResult === "added") {
          // Marquer comme en cours
          await updateOpportunityStatus(
            job.url,
            "EN_COURS",
            projectStatus.reason,
            projectStatus.updateInfo
          );
          inProgressCount++;
        }

        // Poster dans Discord avec indication "en cours"
        await redditChannel.send({
          embeds: [
            redditCard(
              `📋 [EN COURS] ${job.title}`,
              job.url,
              subreddit,
              job.relevanceScore,
              job.description,
              job.numComments,
              job.hoursAgo
            ).setColor(0xffa500), // Orange pour les projets en cours
          ],
        });

        // Afficher les infos d'update si disponibles
        let updateMessage = `**📋 Projet en révision** (${projectStatus.reason})\n`;

        if (projectStatus.updateInfo) {
          const info = projectStatus.updateInfo;
          if (info.timeline)
            updateMessage += `⏰ **Timeline:** ${info.timeline}\n`;
          if (info.responseCount)
            updateMessage += `📊 **Réponses:** ${info.responseCount}\n`;
          if (info.stage) updateMessage += `🎯 **Étape:** ${info.stage}\n`;
          if (info.notes.length > 0)
            updateMessage += `📝 **Notes:** ${info.notes.join(", ")}\n`;
        }

        updateMessage += `*Opportunité marquée comme "EN_COURS" dans Google Sheets*`;

        await redditChannel.send(updateMessage);

        continue; // Passer au job suivant
      }

      // 🔄 TRAITEMENT NORMAL pour les projets ouverts
      const subredditMatch = job.url.match(/\/r\/([^/]+)\//);
      const subreddit = subredditMatch ? subredditMatch[1] : "unknown";

      const opportunityData = {
        ...job,
        subreddit: subreddit,
      };

      const sheetResult = await addOpportunityToSheet(opportunityData);

      if (sheetResult === "added") {
        // ... votre code existant pour traitement normal ...
        processedCount++;
      }
    } catch (error) {
      console.error(`❌ Erreur traitement job "${job.title}":`, error);
    }
  }

  if (closedCount > 0) {
    const statusChannel = guild.channels.cache.get(channelIds.status);
    if (statusChannel) {
      await statusChannel.send({
        embeds: [
          statusCard(
            `🔒 ${closedCount} projets fermés détectés et marqués automatiquement`,
            "info"
          ),
        ],
      });
    }
  }

  return processedCount;
};

const PREFIX = "!!";

client.on("ready", async () => {
  console.log(`🤖 Art Jobs Bot connecté en tant que ${client.user.tag}!`);

  // Configuration automatique des channels
  for (const guild of client.guilds.cache.values()) {
    await setupChannels(guild);
  }

  // Initialiser Google Sheets
  console.log("📊 Initialisation Google Sheets...");
  await initSpreadsheet();

  // Surveillance Reddit - toutes les heures
  cron.schedule("0 */1 * * *", async () => {
    console.log("🔍 Recherche d'offres Reddit en cours...");

    try {
      const allJobs = await getReddit();

      if (!allJobs || allJobs === "error" || allJobs.length === 0) {
        console.log("📝 Aucune offre trouvée ou erreur API");
        return;
      }

      console.log(`🔍 ${allJobs.length} offres trouvées sur Reddit`);

      // Filtrer les nouvelles opportunités via Google Sheets
      const newOpportunities = await getNewOpportunities(allJobs);

      if (newOpportunities.length > 0) {
        console.log(
          `📢 ${newOpportunities.length} nouvelles offres détectées!`
        );

        let totalProcessed = 0;

        for (const guild of client.guilds.cache.values()) {
          const processed = await processOpportunities(newOpportunities, guild);
          totalProcessed += processed;

          const statusChannel = guild.channels.cache.get(channelIds.status);
          if (statusChannel && processed > 0) {
            await statusChannel.send({
              embeds: [
                statusCard(
                  `📊 ${processed} nouvelles offres d'art publiées et ajoutées au Google Sheets`,
                  "success"
                ),
              ],
            });
          }
        }

        console.log(`✅ ${totalProcessed} opportunités traitées au total`);
      } else {
        console.log("📝 Aucune nouvelle offre trouvée");
      }
    } catch (error) {
      console.error("❌ Erreur surveillance Reddit:", error);

      // Notifier l'erreur dans le channel status
      for (const guild of client.guilds.cache.values()) {
        const statusChannel = guild.channels.cache.get(channelIds.status);
        if (statusChannel) {
          await statusChannel.send({
            embeds: [
              statusCard(
                `❌ Erreur lors de la recherche Reddit: ${error.message}`,
                "error"
              ),
            ],
          });
        }
      }
    }
  });

  // Rapport email matinal - tous les jours à 8h
  cron.schedule(
    "0 8 * * *",
    async () => {
      console.log("📧 Envoi du rapport matinal...");

      try {
        const success = await sendMorningReport();

        if (success) {
          // Notifier dans Discord
          for (const guild of client.guilds.cache.values()) {
            const statusChannel = guild.channels.cache.get(channelIds.status);
            if (statusChannel) {
              await statusChannel.send({
                embeds: [
                  statusCard(
                    "📧 Rapport matinal envoyé par email avec succès!",
                    "success"
                  ),
                ],
              });
            }
          }
        }
      } catch (error) {
        console.error("❌ Erreur envoi rapport matinal:", error);

        for (const guild of client.guilds.cache.values()) {
          const statusChannel = guild.channels.cache.get(channelIds.status);
          if (statusChannel) {
            await statusChannel.send({
              embeds: [
                statusCard(
                  `❌ Erreur envoi rapport matinal: ${error.message}`,
                  "error"
                ),
              ],
            });
          }
        }
      }
    },
    {
      timezone: "Europe/Paris",
    }
  );

  cron.schedule("0 10 * * *", async () => {
    console.log("🧹 Nettoyage quotidien des opportunités fermées...");

    try {
      const result = await autoCloseFoundOpportunities();

      if (result.success && result.closedCount > 0) {
        for (const guild of client.guilds.cache.values()) {
          const statusChannel = guild.channels.cache.get(channelIds.status);
          if (statusChannel) {
            await statusChannel.send({
              embeds: [
                statusCard(
                  `🧹 Nettoyage automatique: ${result.closedCount} opportunités fermées détectées et mises à jour`,
                  "info"
                ),
              ],
            });
          }
        }
      }
    } catch (error) {
      console.error("❌ Erreur nettoyage quotidien:", error);
    }
  });

  console.log("⏰ Surveillance Reddit activée (toutes les 2 heures)");
  console.log("📧 Rapport matinal programmé (8h tous les jours)");
  console.log("📊 Gestion des doublons via Google Sheets");
});

client.on("messageCreate", async (message) => {
  if (!message.content.startsWith(PREFIX) || message.author.bot) return;

  const input = message.content.slice(PREFIX.length).trim().split(" ");
  const command = input.shift().toLowerCase();

  switch (command) {
    case "ping":
      message.channel.send("🏓 Pong! Bot en ligne ✅");
      break;

    case "status":
      const embed = statusCard(
        `🤖 **Art Jobs Bot Status**\n\n` +
          `✅ **Reddit:** Surveillance active\n` +
          `⏰ **Fréquence:** Toutes les 2 heures\n` +
          `📊 **Serveurs:** ${client.guilds.cache.size}\n` +
          `👥 **Utilisateurs:** ${client.users.cache.size}\n\n` +
          `**Subreddits surveillés:**\n` +
          `• r/HungryArtists\n` +
          `• r/artcommissions\n` +
          `• r/starvingartists\n` +
          `• r/hireanartist\n\n` +
          `**Spécialités ciblées:**\n` +
          `🐲 Creature Design (priorité #1)\n` +
          `🎨 Character Design\n` +
          `🎲 D&D/RPG Art\n` +
          `🎮 Game Art\n` +
          `🖌️ Style: Semi-réaliste, Stylisé\n\n` +
          `**Fonctionnalités:**\n` +
          `📊 Google Sheets (source unique)\n` +
          `📧 Rapport matinal (8h)\n` +
          `🚨 Alertes urgentes\n` +
          `🔄 Anti-doublons intelligent`,
        "info"
      );
      message.channel.send({ embeds: [embed] });
      break;

    case "search":
    case "test":
      message.channel.send("🔍 Recherche manuelle en cours...");

      try {
        const jobs = await getReddit();

        if (!jobs || jobs === "error" || jobs.length === 0) {
          message.channel.send("❌ Aucune offre trouvée ou erreur API");
          return;
        }

        console.log(`🔍 ${jobs.length} offres trouvées sur Reddit`);

        // Utiliser la nouvelle fonction pour filtrer via Google Sheets
        const newOpportunities = await getNewOpportunities(jobs.slice(0, 5)); // Limiter à 5 pour le test

        if (newOpportunities.length > 0) {
          message.channel.send(
            `📢 **Test**: ${newOpportunities.length} nouvelles offres trouvées`
          );

          for (const job of newOpportunities) {
            const subredditMatch = job.url.match(/\/r\/([^/]+)\//);
            const subreddit = subredditMatch ? subredditMatch[1] : "unknown";

            const opportunityData = {
              ...job,
              subreddit: subreddit,
            };

            // Ajouter à Google Sheets avec feedback
            try {
              const sheetResult = await addOpportunityToSheet(opportunityData);

              switch (sheetResult) {
                case "added":
                  message.channel.send(
                    `✅ Ajouté aux Sheets: ${job.title.substring(0, 40)}...`
                  );
                  break;
                case "duplicate":
                  message.channel.send(
                    `⏭️ Déjà en Sheets: ${job.title.substring(0, 40)}...`
                  );
                  break;
                case "error":
                  message.channel.send(
                    `❌ Erreur Sheets: ${job.title.substring(0, 40)}...`
                  );
                  break;
                default:
                  message.channel.send(`⚠️ Statut inconnu: ${sheetResult}`);
              }
            } catch (sheetError) {
              console.error("❌ Erreur Sheets:", sheetError);
              message.channel.send(
                `❌ Exception Sheets: ${sheetError.message}`
              );
            }

            // Générer réponse suggérée
            const responseData = generateResponse(
              job.title.toLowerCase(),
              0,
              job.description
            );

            // Afficher la carte
            await message.channel.send({
              embeds: [
                redditCard(
                  job.title,
                  job.url,
                  subreddit,
                  job.relevanceScore,
                  job.description,
                  job.numComments,
                  job.hoursAgo
                ),
              ],
            });

            // Proposer une réponse automatique
            await message.channel.send(
              `**💬 Réponse suggérée (${responseData.selectedCategory}, budget: $${responseData.detectedBudget}):**\n` +
                `\`\`\`${responseData.response}\`\`\``
            );

            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        } else {
          message.channel.send(
            "📝 Aucune nouvelle offre pour ce test (toutes déjà en Google Sheets)"
          );
        }
      } catch (error) {
        message.channel.send(`❌ Erreur durant la recherche: ${error.message}`);
      }
      break;

    case "force-search":
      message.channel.send(
        "🔍 **Recherche FORCÉE** (ignore les doublons) en cours..."
      );

      try {
        const jobs = await getRedditForced();

        if (!jobs || jobs === "error" || jobs.length === 0) {
          message.channel.send("❌ Aucune offre trouvée même en forçant");
          return;
        }

        message.channel.send(
          `📢 **Recherche forcée**: ${jobs.length} offres trouvées (peuvent être anciennes)`
        );

        for (let i = 0; i < Math.min(jobs.length, 5); i++) {
          const job = jobs[i];
          const subredditMatch = job.url.match(/\/r\/([^/]+)\//);
          const subreddit = subredditMatch ? subredditMatch[1] : "unknown";

          // Générer réponse suggérée
          const responseData = generateResponse(
            job.title.toLowerCase(),
            0,
            job.description
          );

          await message.channel.send({
            embeds: [
              redditCard(
                job.title,
                job.url,
                subreddit,
                job.relevanceScore,
                job.description,
                job.numComments,
                job.hoursAgo
              ),
            ],
          });

          await message.channel.send(
            `**💬 Réponse suggérée (${responseData.selectedCategory}, budget: $${responseData.detectedBudget}):**\n` +
              `\`\`\`${responseData.response}\`\`\``
          );

          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        message.channel.send(
          `❌ Erreur durant la recherche forcée: ${error.message}`
        );
      }
      break;

    case "test-email":
      message.channel.send("📧 Test d'envoi du rapport matinal...");

      try {
        const success = await sendMorningReport();
        if (success) {
          message.channel.send(
            "✅ Rapport matinal testé avec succès! Vérifiez votre email."
          );
        } else {
          message.channel.send("❌ Erreur lors du test d'email");
        }
      } catch (error) {
        message.channel.send(`❌ Erreur test email: ${error.message}`);
      }
      break;

    case "test-sheets":
      message.channel.send("📊 Test de connexion Google Sheets...");

      try {
        const success = await initSpreadsheet();
        if (success) {
          message.channel.send("✅ Google Sheets connecté avec succès!");
        } else {
          message.channel.send("❌ Erreur connexion Google Sheets");
        }
      } catch (error) {
        message.channel.send(`❌ Erreur test Sheets: ${error.message}`);
      }
      break;

    case "stats":
      message.channel.send("📊 Récupération des statistiques Google Sheets...");

      try {
        const { getSheetStats } = await import("./googleSheets.js");
        const stats = await getSheetStats();

        if (stats) {
          const statsEmbed = new EmbedBuilder()
            .setColor(blue_color)
            .setTitle("📊 Statistiques Google Sheets")
            .setDescription(
              `**📈 Total Opportunités:** ${stats.total}\n` +
                `**🆕 Nouvelles:** ${stats.nouveaux}\n` +
                `**⭐ Prioritaires:** ${stats.priorites}\n` +
                `**📝 Sans Réponse:** ${stats.sansReponse}\n\n` +
                `**📋 Par Catégorie:**\n` +
                Object.entries(stats.categories)
                  .map(([cat, count]) => `• ${cat}: ${count}`)
                  .join("\n")
            )
            .setTimestamp();

          message.channel.send({ embeds: [statsEmbed] });
        } else {
          message.channel.send("❌ Impossible de récupérer les statistiques");
        }
      } catch (error) {
        message.channel.send(`❌ Erreur stats: ${error.message}`);
      }
      break;

    case "help":
      const helpEmbed = new EmbedBuilder()
        .setColor(blue_color)
        .setTitle("🤖 Commandes Art Jobs Bot")
        .setDescription(
          `**${PREFIX}ping** - Test de connexion\n` +
            `**${PREFIX}status** - Statut détaillé du bot\n` +
            `**${PREFIX}search** ou **${PREFIX}test** - Recherche manuelle\n` +
            `**${PREFIX}force-search** - Recherche forcée (ignore doublons)\n` +
            `**${PREFIX}stats** - Statistiques Google Sheets\n` +
            `**${PREFIX}test-email** - Test rapport email\n` +
            `**${PREFIX}test-sheets** - Test connexion Google Sheets\n` +
            `**${PREFIX}help** - Cette aide\n\n` +
            `🔄 **Surveillance automatique** toutes les 2 heures\n` +
            `📧 **Rapport matinal** tous les jours à 8h\n` +
            `📊 **Google Sheets** source unique de vérité\n` +
            `🚨 **Alertes urgentes** par email\n` +
            `🔄 **Anti-doublons** automatique`
        )
        .setFooter({
          text: "Bot développé pour maximiser vos opportunités en creature design",
        })
        .setTimestamp();

      message.channel.send({ embeds: [helpEmbed] });
      break;
    case "test-ai":
      message.channel.send("🚀 Test de l'IA Groq...");

      try {
        const success = await testGroqConnection();
        if (success) {
          message.channel.send("✅ Connexion Groq OK! Test d'analyse...");

          const testJob = {
            title:
              "[HIRING] Looking for creature design for D&D campaign - $500 budget",
            description:
              "Need original monster designs for my homebrew campaign. Semi-realistic style preferred. Looking for 5 unique creatures with reference sheets and lore descriptions.",
            subreddit: "HungryArtists",
            relevanceScore: 22,
          };

          const analysis = await analyzeJobWithAI(testJob);

          message.channel.send(
            `**🤖 Résultat test IA:**\n\`\`\`${analysis.response}\`\`\`\n` +
              `*✅ Succès: ${analysis.success ? "Oui" : "Non"} | ⚡ ${
                analysis.metadata.provider
              } | 🕐 ${analysis.metadata.responseTime}ms | 📊 Qualité: ${
                analysis.analysis.qualityScore
              }/10*`
          );
        } else {
          message.channel.send(
            "❌ Impossible de se connecter à Groq. Vérifiez votre GROQ_API_KEY."
          );
        }
      } catch (error) {
        message.channel.send(`❌ Erreur test IA: ${error.message}`);
      }
      break;

    case "ai-stats":
      message.channel.send("📊 Récupération des statistiques Groq...");

      try {
        const stats = getGroqUsageStats();

        const statsEmbed = new EmbedBuilder()
          .setColor(blue_color)
          .setTitle("📊 Statistiques Groq IA")
          .setDescription(
            `**🔢 Utilisation Globale:**\n` +
              `• Total requêtes: ${stats.totalRequests}\n` +
              `• Succès: ${stats.successfulRequests} (${stats.successRate}%)\n` +
              `• Échecs: ${stats.failedRequests}\n\n` +
              `**🪙 Tokens:**\n` +
              `• Total consommé: ${stats.totalTokens.toLocaleString()}\n` +
              `• Moyenne/requête: ${stats.averageTokensPerRequest}\n` +
              `• Vitesse: ${stats.tokensPerMinute}/min\n\n` +
              `**⚡ Performance:**\n` +
              `• Temps moyen: ${stats.averageResponseTime}ms\n` +
              `• Uptime: ${stats.uptimeHours}h\n\n` +
              `**📅 Aujourd'hui (${stats.today.date}):**\n` +
              `• Requêtes: ${stats.today.requests}\n` +
              `• Tokens: ${stats.today.tokens}\n` +
              `• Succès: ${stats.today.successes}/${stats.today.requests} (${stats.today.successRate}%)\n\n` +
              `**🚦 Limites Groq:**\n` +
              `• Limite: 6000 tokens/min\n` +
              `• Utilisation: ${stats.tokensPerMinute}/min\n` +
              `• Disponible: ~${stats.groqLimits.remainingEstimate} tokens/min\n` +
              `${
                stats.groqLimits.isNearLimit
                  ? "⚠️ **Proche de la limite !**"
                  : "✅ **Marge confortable**"
              }\n\n` +
              `**💰 Coût:** $0.00 (Groq = Gratuit! 🎉)`
          )
          .setTimestamp()
          .setFooter({
            text: "Stats en temps réel • Se remet à zéro au redémarrage",
          });

        // Ajouter les erreurs si il y en a
        if (Object.keys(stats.errorTypes).length > 0) {
          const errorsList = Object.entries(stats.errorTypes)
            .map(([error, count]) => `• ${error}: ${count}x`)
            .join("\n");
          statsEmbed.addFields({
            name: "❌ Erreurs",
            value: errorsList,
            inline: false,
          });
        }

        message.channel.send({ embeds: [statsEmbed] });
      } catch (error) {
        message.channel.send(`❌ Erreur récupération stats: ${error.message}`);
      }
      break;

    case "ai-reset-stats":
      message.channel.send("🔄 Réinitialisation des statistiques Groq...");
      try {
        resetGroqStats();
        message.channel.send("✅ Statistiques réinitialisées !");
      } catch (error) {
        message.channel.send(`❌ Erreur reset: ${error.message}`);
      }
      break;

    case "ai-daily":
      message.channel.send("📅 Rapport quotidien...");
      try {
        const report = getDailyStatsReport();
        message.channel.send(report);
      } catch (error) {
        message.channel.send(`❌ Erreur rapport: ${error.message}`);
      }
      break;

    case "check-closed":
      message.channel.send("🔍 Vérification des projets fermés...");

      try {
        const result = await autoCloseFoundOpportunities();

        if (result.success) {
          if (result.closedCount > 0 || result.inProgressCount > 0) {
            let message = `✅ **Nettoyage terminé!**\n`;
            if (result.closedCount > 0) {
              message += `🔒 ${result.closedCount} opportunités fermées détectées\n`;
            }
            if (result.inProgressCount > 0) {
              message += `📋 ${result.inProgressCount} opportunités en cours détectées\n`;
            }
            message += `📊 Statuts mis à jour dans Google Sheets`;

            message.channel.send(message);

            // Afficher les détails si pas trop nombreux
            if (result.details && result.details.length <= 5) {
              for (const detail of result.details) {
                let emoji = detail.action === "closed" ? "🔒" : "📋";
                let actionText =
                  detail.action === "closed" ? "Fermé" : "En cours";

                message.channel.send(
                  `${emoji} **${actionText}:** ${detail.title.substring(
                    0,
                    50
                  )}...\n` +
                    `**Raison:** ${detail.reason}\n` +
                    `**Nouveau statut:** ${detail.newStatus}`
                );
              }
            }
          } else {
            message.channel.send(
              "✅ Aucune opportunité fermée ou en cours détectée"
            );
          }
        } else {
          message.channel.send(`❌ Erreur: ${result.error}`);
        }
      } catch (error) {
        message.channel.send(`❌ Erreur vérification: ${error.message}`);
      }
      break;

    case "test-closed":
      const testUrl = "https://reddit.com/test";
      const testTitles = [
        "Looking for artist - FOUND thanks everyone!",
        "[HIRING] Character design needed - $300",
        "Need creature art [FILLED]",
        "Artist wanted for game (EDIT: Found someone, thanks!)",
      ];

      message.channel.send("🧪 Test détection projets fermés...\n");

      for (const title of testTitles) {
        const mockSubmission = {
          title: title,
          selftext: "",
          link_flair_text: "",
        };

        const status = detectProjectStatus(mockSubmission);
        const result = status.isClosed ? "🔒 FERMÉ" : "✅ OUVERT";

        message.channel.send(
          `${result} "${title}"\n` + `Raison: ${status.reason}`
        );
      }
      break;

    case "check-closed-deep":
      message.channel.send(
        "🔍 Vérification APPROFONDIE des projets fermés (avec fetch Reddit)..."
      );

      try {
        const result = await autoCloseFoundOpportunitiesEnhanced();

        if (result.success) {
          let statusMessage = `✅ **Nettoyage approfondi terminé!**\n`;
          statusMessage += `📊 **Total vérifié:** ${result.totalChecked}\n`;

          if (result.closedCount > 0) {
            statusMessage += `🔒 **Fermés:** ${result.closedCount}\n`;
          }
          if (result.inProgressCount > 0) {
            statusMessage += `📋 **En cours:** ${result.inProgressCount}\n`;
          }
          if (result.errorCount > 0) {
            statusMessage += `❌ **Erreurs:** ${result.errorCount}\n`;
          }

          message.channel.send(statusMessage);

          // Afficher les détails
          if (result.details && result.details.length > 0) {
            for (const detail of result.details.slice(0, 5)) {
              // Limiter à 5
              const emoji = detail.action === "closed" ? "🔒" : "📋";
              const method =
                detail.method === "reddit_fetch" ? "🌐 Reddit" : "📋 Titre";

              message.channel.send(
                `${emoji} **${detail.title.substring(0, 40)}...**\n` +
                  `└ ${detail.newStatus} (${method})`
              );
            }

            if (result.details.length > 5) {
              message.channel.send(
                `... et ${result.details.length - 5} autres mises à jour`
              );
            }
          }
        } else {
          message.channel.send(`❌ Erreur: ${result.error}`);
        }
      } catch (error) {
        message.channel.send(`❌ Erreur vérification: ${error.message}`);
      }
      break;

    default:
      message.channel.send(
        "❓ Commande inconnue. Utilisez `!!help` pour voir les commandes disponibles."
      );
      break;
  }
});

// Gestion des erreurs
client.on("error", (error) => {
  console.error("❌ Erreur Discord:", error);
});

process.on("unhandledRejection", (error) => {
  console.error("❌ Erreur non gérée:", error);
});

client.login(process.env.DTOKEN);
