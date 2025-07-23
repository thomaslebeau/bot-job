import dotenv from "dotenv";
import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ChannelType,
} from "discord.js";
import fs from "fs/promises";
import cron from "node-cron";
import { getReddit } from "./getReddit.js";

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

const redditCard = (title, url, subreddit) => {
  // Extraire le budget s'il est visible dans le titre
  const budgetMatch = title.match(/\$(\d+(?:,\d+)?(?:\.\d+)?)/);
  const budget = budgetMatch ? `💰 Budget: $${budgetMatch[1]}` : "";

  return new EmbedBuilder()
    .setColor(red_color)
    .setTitle(
      "🎨 " + (title.length > 200 ? title.substring(0, 200) + "..." : title)
    )
    .setURL(url)
    .setDescription(
      `**Subreddit:** r/${subreddit}\n${budget}\n\n[👀 Voir l'annonce complète](${url})`
    )
    .setTimestamp()
    .setFooter({ text: `Reddit • r/${subreddit}` });
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
            "🚀 Bot Art Jobs démarré avec succès!\n\n**Surveillance Reddit active:**\n• HungryArtists\n• artcommissions\n• starvingartists\n• hireanartist\n\n**Vérification:** Toutes les 2 heures ⏰",
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

// Fonction pour gérer les doublons
const loadProcessedJobs = async () => {
  try {
    const data = await fs.readFile("./processed_jobs.json", {
      encoding: "utf8",
    });
    return JSON.parse(data);
  } catch (error) {
    console.log("📄 Création du fichier de suivi des jobs...");
    return [];
  }
};

const saveProcessedJobs = async (jobs) => {
  try {
    await fs.writeFile("./processed_jobs.json", JSON.stringify(jobs, null, 2));
  } catch (error) {
    console.error("❌ Erreur sauvegarde:", error);
  }
};

const filterNewJobs = (newJobs, processedJobs) => {
  if (!newJobs || newJobs.length === 0) return [];

  return newJobs.filter(
    (newJob) =>
      !processedJobs.some(
        (processed) =>
          processed.title === newJob.title || processed.url === newJob.url
      )
  );
};

const PREFIX = "!!";

client.on("ready", async () => {
  console.log(`🤖 Art Jobs Bot connecté en tant que ${client.user.tag}!`);

  // Configuration automatique des channels
  for (const guild of client.guilds.cache.values()) {
    await setupChannels(guild);
  }

  // Surveillance Reddit - toutes les 2 heures
  cron.schedule("0 */2 * * *", async () => {
    console.log("🔍 Recherche d'offres Reddit en cours...");

    try {
      const newJobs = await getReddit();

      if (!newJobs || newJobs === "error" || newJobs.length === 0) {
        console.log("📝 Aucune offre trouvée ou erreur API");
        return;
      }

      const processedJobs = await loadProcessedJobs();
      const filteredJobs = filterNewJobs(newJobs, processedJobs);

      if (filteredJobs.length > 0) {
        console.log(
          `📢 ${filteredJobs.length} nouvelles offres Reddit trouvées!`
        );

        for (const guild of client.guilds.cache.values()) {
          const redditChannel = guild.channels.cache.get(channelIds.reddit);
          const statusChannel = guild.channels.cache.get(channelIds.status);

          if (redditChannel) {
            for (const job of filteredJobs) {
              // Déterminer le subreddit depuis l'URL
              const subredditMatch = job.url.match(/\/r\/([^/]+)\//);
              const subreddit = subredditMatch ? subredditMatch[1] : "unknown";

              await redditChannel.send({
                embeds: [redditCard(job.title, job.url, subreddit)],
              });

              // Délai pour éviter le rate limiting Discord
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          }

          if (statusChannel) {
            await statusChannel.send({
              embeds: [
                statusCard(
                  `📊 ${filteredJobs.length} nouvelles offres d'art publiées`,
                  "success"
                ),
              ],
            });
          }
        }

        // Sauvegarder les jobs traités (garder les 1000 derniers)
        const updatedProcessed = [...processedJobs, ...filteredJobs];
        const recentJobs = updatedProcessed.slice(-1000);
        await saveProcessedJobs(recentJobs);
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

  console.log("⏰ Surveillance Reddit activée (toutes les 2 heures)");
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
          `• r/hireanartist`,
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

        const processedJobs = await loadProcessedJobs();
        const filteredJobs = filterNewJobs(jobs.slice(0, 5), processedJobs); // Limiter à 5 pour le test

        if (filteredJobs.length > 0) {
          message.channel.send(
            `📢 **Test**: ${filteredJobs.length} offres trouvées`
          );

          for (const job of filteredJobs) {
            const subredditMatch = job.url.match(/\/r\/([^/]+)\//);
            const subreddit = subredditMatch ? subredditMatch[1] : "unknown";

            await message.channel.send({
              embeds: [redditCard(job.title, job.url, subreddit)],
            });

            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        } else {
          message.channel.send(
            "📝 Aucune nouvelle offre pour ce test (déjà traitées)"
          );
        }
      } catch (error) {
        message.channel.send(`❌ Erreur durant la recherche: ${error.message}`);
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
            `**${PREFIX}help** - Cette aide\n\n` +
            `🔄 **Surveillance automatique** toutes les 2 heures`
        )
        .setFooter({
          text: "Bot développé pour surveiller les offres d'art sur Reddit",
        })
        .setTimestamp();

      message.channel.send({ embeds: [helpEmbed] });
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
