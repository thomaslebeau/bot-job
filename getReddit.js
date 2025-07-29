import snoowrap from "snoowrap";

// Fonction pour scorer la pertinence selon vos spécialités RÉELLES
const scoreJobRelevance = (title, description = "") => {
  const text = (title + " " + description).toLowerCase();
  let score = 0;

  // VOS SPÉCIALITÉS PRIORITAIRES
  const highPriorityKeywords = {
    // CREATURE DESIGN (votre point fort !)
    "creature design": 20,
    "creature concept": 18,
    "monster design": 18,
    "beast design": 16,
    "creature art": 15,
    "creature concept art": 18,
    "monster concept": 16,
    "creature illustration": 15,
    "mythical creature": 14,
    "fantasy creature": 14,
    "dragon design": 16,
    "demon design": 14,
    "alien design": 14,
    "monster manual": 15,
    bestiary: 14,
    "creature sheet": 12,

    // Character Design (votre autre force)
    "character design": 15,
    "character concept": 12,
    "character art": 10,
    "character sheet": 10,
    "original character": 8,
    "oc commission": 8,

    // D&D / RPG (très compatible creature design)
    dnd: 15,
    "d&d": 15,
    "dungeons and dragons": 15,
    pathfinder: 12,
    rpg: 8,
    tabletop: 8,
    fantasy: 8,
    "monster manual": 15,
    homebrew: 10,

    // Classes D&D qui ont souvent des familiers/creatures
    druid: 8,
    ranger: 8,
    warlock: 8,
    summoner: 10,
    "beast master": 12,

    // Jeux avec beaucoup de creatures
    "board game": 12,
    "card game": 10,
    tcg: 8,
    "trading card": 8,
    "game art": 10,
    kickstarter: 6,

    // VOTRE STYLE : Semi-réaliste et stylisé
    "semi realistic": 12,
    "semi-realistic": 12,
    stylized: 12,
    "semi realism": 10,
    painterly: 8,
    "concept art": 10,
    "digital painting": 8,
    illustration: 6,
    "fantasy art": 8,
    "dark fantasy": 8,
    gothic: 6,

    // Types de créatures populaires
    dragon: 10,
    demon: 8,
    devil: 8,
    angel: 6,
    undead: 8,
    zombie: 6,
    vampire: 6,
    werewolf: 8,
    griffin: 8,
    phoenix: 8,
    hydra: 8,
    chimera: 10,
    sphinx: 8,
    minotaur: 8,
    centaur: 8,
    elemental: 8,
    familiar: 10,
    companion: 8,
    mount: 8,
    pet: 6,
  };

  // Styles/types à éviter ou moins compatibles avec vos compétences
  const avoidKeywords = {
    // Styles que vous ne faites PAS
    "anime style": -8,
    "manga style": -8,
    anime: -6,
    manga: -6,
    cartoon: -4,
    chibi: -8,
    kawaii: -8,
    "cel shading": -6,

    // Styles trop éloignés
    photorealistic: -10,
    hyperrealistic: -12,
    "photo manipulation": -10,
    "photo editing": -10,
    "realistic portrait": -8,
    "oil painting": -6,
    watercolor: -4,
    "pixel art": -6,
    "vector art": -8,
    minimalist: -6,

    // Types de travaux non pertinents
    logo: -12,
    "business card": -10,
    website: -10,
    "ui/ux": -12,
    "graphic design": -8,
    banner: -6,
    poster: -4,
    architecture: -10,
    "landscape only": -6,
    "environment only": -5,
    "background only": -4,
    "real estate": -12,
    wedding: -10,
    "family portrait": -8,
    "pet portrait": -4, // sauf si c'est fantasy/creature

    // Budgets dérisoires
    $5: -20,
    $10: -15,
    $15: -12,
    $20: -8,
    "very low budget": -8,
    "student budget": -6,
    cheap: -8,
    free: -15,
  };

  // Bonus spéciaux pour creature design
  const creatureBonusKeywords = {
    "detailed anatomy": 5,
    "concept sheet": 4,
    turnaround: 5,
    "multiple views": 4,
    "reference sheet": 3,
    orthographic: 4,
    "front and back": 3,
    "side view": 2,
    "full body": 3,
    "anatomy study": 4,
    "creature ecology": 6,
    lore: 3,
    worldbuilding: 4,
    "original creation": 4,
    "unique design": 3,
    "creative freedom": 5,
    "artistic interpretation": 4,
    "long term": 6,
    "ongoing project": 5,
    series: 4,
    "multiple creatures": 6,
    "bestiary project": 8,
    "creature compendium": 8,
    "commercial use": 5,
    "game development": 6,
    "indie game": 4,
    "concept development": 5,
  };

  // Calculer le score
  for (const [keyword, points] of Object.entries(highPriorityKeywords)) {
    if (text.includes(keyword)) {
      score += points;
    }
  }

  for (const [keyword, points] of Object.entries(avoidKeywords)) {
    if (text.includes(keyword)) {
      score += points; // points est déjà négatif
    }
  }

  for (const [keyword, points] of Object.entries(creatureBonusKeywords)) {
    if (text.includes(keyword)) {
      score += points;
    }
  }

  // Bonus pour budgets décents (creature design = travail complexe)
  const budgetMatch = text.match(/\$(\d+)/);
  if (budgetMatch) {
    const budget = parseInt(budgetMatch[1]);
    if (budget >= 1000) score += 12; // Très gros projet
    else if (budget >= 500) score += 8; // Projet sérieux
    else if (budget >= 200) score += 5; // Correct
    else if (budget >= 100) score += 2; // Minimum
    else if (budget >= 50) score += 0; // Limite basse
    // En dessous de 50$ = pas de bonus, voir malus plus haut
  }

  // Malus pour urgence (creature design = temps nécessaire)
  if (
    text.includes("asap") ||
    text.includes("urgent") ||
    text.includes("rush")
  ) {
    score -= 3;
  }

  // Bonus pour timeline réaliste
  if (
    text.includes("flexible timeline") ||
    text.includes("no rush") ||
    text.includes("take your time")
  ) {
    score += 3;
  }

  return score;
};

// Fonction pour ajuster le score selon fraîcheur et concurrence
const adjustScoreForTimingAndCompetition = (
  baseScore,
  hoursAgo,
  numComments,
  canComment = true // 🆕 NOUVEAU PARAMÈTRE
) => {
  let adjustedScore = baseScore;

  // 🆕 MALUS SÉVÈRE SI COMMENTAIRES FERMÉS
  if (!canComment) {
    adjustedScore -= 20; // Gros malus car inutile
  }

  // Bonus pour fraîcheur (posts récents)
  if (hoursAgo <= 1) {
    adjustedScore += 5; // Très récent
  } else if (hoursAgo <= 6) {
    adjustedScore += 3; // Récent
  } else if (hoursAgo <= 24) {
    adjustedScore += 1; // Aujourd'hui
  }
  // Pas de malus pour les posts plus anciens, juste pas de bonus

  // Bonus pour faible concurrence
  if (numComments === 0) {
    adjustedScore += 4; // Aucun concurrent !
  } else if (numComments <= 10) {
    adjustedScore += 2; // Peu de concurrence
  } else if (numComments <= 40) {
    adjustedScore += 1; // Concurrence modérée
  } else if (numComments >= 80) {
    adjustedScore -= 2; // Forte concurrence
  }

  return adjustedScore;
};

const detectProjectStatus = (submission) => {
  const title = submission.title.toLowerCase();
  const description = (submission.selftext || "").toLowerCase();
  const flair = (submission.link_flair_text || "").toLowerCase();
  const fullText = title + " " + description + " " + flair;

  // Mots-clés indiquant que l'artiste a été trouvé
  const foundKeywords = [
    "found",
    "artist found",
    "position filled",
    "filled",
    "closed",
    "complete",
    "completed",
    "hired",
    "thank you everyone",
    "thanks everyone",
    "no longer needed",
    "no longer looking",
    "not needed anymore",
    "edit: found",
    "update: found",
    "edit: filled",
    "update: filled",
    "edit: closed",
    "update: closed",
    "edit: hired",
    "update: hired",
    "solved",
    "done",
    "finished",
    "going with someone",
    "chosen an artist",
    "selected an artist",
  ];

  const updateKeywords = [
    "update:",
    "edit:",
    "going through responses",
    "going through all the responses",
    "reviewing responses",
    "looking through responses",
    "working on going through",
    "reaching out to folks",
    "reaching out to people",
    "contacting artists",
    "reviewing applications",
    "taking a couple days",
    "might take us",
    "will take some time",
    "need more time",
    "overwhelmed with responses",
    "lots of responses",
    "many responses",
    "tons of responses",
    "still deciding",
    "still choosing",
    "making a decision",
    "decision soon",
    "will update soon",
    "update coming",
    "narrowing down",
    "shortlisting",
    "final decision",
    "almost decided",
  ];

  // Patterns spécifiques
  const foundPatterns = [
    /\[found\]/,
    /\[filled\]/,
    /\[closed\]/,
    /\[hired\]/,
    /\[complete\]/,
    /edit.*found/,
    /update.*found/,
    /edit.*filled/,
    /update.*filled/,
    /edit.*hired/,
    /update.*hired/,
    /thanks.*everyone.*found/,
    /thank.*you.*all.*found/,
    /going with.*artist/,
    /chosen.*artist/,
    /selected.*artist/,
  ];

  // 🆕 PATTERNS POUR UPDATE/EN_COURS
  const updatePatterns = [
    /update:.*going through/,
    /edit:.*going through/,
    /update:.*reviewing/,
    /edit:.*reviewing/,
    /update:.*reaching out/,
    /edit:.*reaching out/,
    /update:.*overwhelmed/,
    /update:.*lots of/,
    /update:.*many/,
    /going through.*responses/,
    /reviewing.*responses/,
    /reaching out.*folks/,
    /take.*couple.*days/,
    /need.*more.*time/,
    /still.*deciding/,
    /making.*decision/,
    /narrowing.*down/,
    /shortlisting/,
  ];

  const hasFoundKeyword = foundKeywords.some((keyword) =>
    fullText.includes(keyword)
  );
  const hasFoundPattern = foundPatterns.some((pattern) =>
    pattern.test(fullText)
  );
  const hasFoundFlair =
    flair.includes("found") ||
    flair.includes("filled") ||
    flair.includes("closed") ||
    flair.includes("hired") ||
    flair.includes("complete");

  // 🆕 VÉRIFIER LES UPDATE
  const hasUpdateKeyword = updateKeywords.some((keyword) =>
    fullText.includes(keyword)
  );
  const hasUpdatePattern = updatePatterns.some((pattern) =>
    pattern.test(fullText)
  );

  // Vérifier si c'est un update mais pas encore fermé
  const isInProgress =
    (hasUpdateKeyword || hasUpdatePattern) &&
    !hasFoundKeyword &&
    !hasFoundPattern &&
    !hasFoundFlair;

  const isProjectClosed = hasFoundKeyword || hasFoundPattern || hasFoundFlair;

  // Déterminer le statut
  let status = "OUVERT";
  let reason = "OPEN";

  if (isProjectClosed) {
    status = "FERMÉ";
    reason = hasFoundFlair
      ? "FLAIR_FOUND"
      : hasFoundPattern
      ? "PATTERN_FOUND"
      : "KEYWORD_FOUND";
  } else if (isInProgress) {
    status = "EN_COURS";
    reason = hasUpdatePattern ? "UPDATE_PATTERN" : "UPDATE_KEYWORD";
  }

  return {
    isClosed: isProjectClosed,
    isInProgress: isInProgress,
    isDeleted: false,
    status: status,
    reason: reason,
    details: {
      foundInTitle: foundKeywords.some((keyword) => title.includes(keyword)),
      foundInDescription: foundKeywords.some((keyword) =>
        description.includes(keyword)
      ),
      foundInFlair: hasFoundFlair,
      foundPattern: hasFoundPattern,
      // 🆕 DÉTAILS UPDATE
      updateInTitle: updateKeywords.some((keyword) => title.includes(keyword)),
      updateInDescription: updateKeywords.some((keyword) =>
        description.includes(keyword)
      ),
      updatePattern: hasUpdatePattern,
      // 🆕 DÉTAILS SUPPRESSION
      deletedByUser: false,
      removedByMods: false,
    },
    // 🆕 INFORMATIONS EXTRAITES DE L'UPDATE
    updateInfo: isInProgress ? extractUpdateInfo(fullText) : null,
  };
};

const extractUpdateInfo = (text) => {
  const info = {
    timeline: null,
    responseCount: null,
    stage: null,
    notes: [],
  };

  // Extraire timeline
  const timelinePatterns = [
    /couple.*days?/,
    /few.*days?/,
    /(\d+).*days?/,
    /week/,
    /soon/,
    /taking.*time/,
  ];

  for (const pattern of timelinePatterns) {
    const match = text.match(pattern);
    if (match) {
      info.timeline = match[0];
      break;
    }
  }

  // Extraire nombre de réponses
  const responsePatterns = [
    /lots of responses/,
    /many responses/,
    /tons of responses/,
    /overwhelmed.*responses/,
    /(\d+).*responses/,
  ];

  for (const pattern of responsePatterns) {
    const match = text.match(pattern);
    if (match) {
      info.responseCount = match[0];
      break;
    }
  }

  // Déterminer l'étape
  if (text.includes("going through") || text.includes("reviewing")) {
    info.stage = "REVIEWING";
  } else if (text.includes("reaching out") || text.includes("contacting")) {
    info.stage = "CONTACTING";
  } else if (text.includes("deciding") || text.includes("choosing")) {
    info.stage = "DECIDING";
  } else if (text.includes("narrowing") || text.includes("shortlisting")) {
    info.stage = "SHORTLISTING";
  }

  // Notes supplémentaires
  if (text.includes("overwhelmed")) {
    info.notes.push("Overwhelmed with responses");
  }
  if (text.includes("thank")) {
    info.notes.push("Thanking respondents");
  }

  return info;
};

// 🆕 FONCTION POUR DÉTECTER LES "FOR HIRE" DÉGUISÉS
const isForHirePost = (title, description, flair) => {
  const titleLower = title.toLowerCase();
  const descLower = (description || "").toLowerCase();
  const flairLower = (flair || "").toLowerCase();
  const fullText = titleLower + " " + descLower + " " + flairLower;

  // 1. DÉTECTION EXPLICITE "FOR HIRE"
  const explicitForHire = [
    "for hire",
    "forhire",
    "available for work",
    "taking commissions",
    "commissions open",
    "open for commissions",
    "accepting commissions",
  ];

  for (const phrase of explicitForHire) {
    if (fullText.includes(phrase)) {
      console.log(`🚫 For Hire explicite détecté: "${phrase}"`);
      return true;
    }
  }

  // 2. STRUCTURE "JE PROPOSE MES SERVICES"
  const selfPromotion = [
    "i draw",
    "i create",
    "i make",
    "i design",
    "i illustrate",
    "i paint",
    "i do",
    "i offer",
    "i provide",
    "my art",
    "my style",
    "my portfolio",
    "check out my",
    "here's my",
  ];

  // 3. APPELS À L'ACTION
  const callsToAction = [
    "dm me",
    "message me",
    "contact me",
    "pm me",
    "reach out",
    "hit me up",
    "send me a message",
    "feel free to contact",
    "shoot me a message",
  ];

  // 4. SIGNAUX COMMERCIAUX
  const commercialSignals = [
    "commissions open",
    "slots available",
    "slots open",
    "taking orders",
    "booking now",
    "available now",
    "queue open",
    "prices in",
    "starting at $",
    "rates start",
    "portfolio in bio",
    "link in bio",
    "more examples",
  ];

  // SCORING DES SIGNAUX FOR HIRE
  let forHireScore = 0;

  // Vérifier auto-promotion
  const hasAutoPromo = selfPromotion.some((phrase) =>
    titleLower.includes(phrase)
  );
  if (hasAutoPromo) forHireScore += 3;

  // Vérifier appels à l'action
  const hasCallToAction = callsToAction.some((phrase) =>
    fullText.includes(phrase)
  );
  if (hasCallToAction) forHireScore += 2;

  // Vérifier signaux commerciaux
  const hasCommercialSignal = commercialSignals.some((phrase) =>
    fullText.includes(phrase)
  );
  if (hasCommercialSignal) forHireScore += 2;

  // 5. PATTERNS SPÉCIFIQUES
  // Pattern "I do X" suivi d'un appel à l'action
  if (titleLower.match(/^i (draw|create|make|design|do)/) && hasCallToAction) {
    forHireScore += 3;
  }

  // Pattern émojis + appel à l'action
  if (title.includes("🎨") && hasCallToAction) {
    forHireScore += 2;
  }

  // Absence de mots-clés "client cherche artiste"
  const clientKeywords = [
    "looking for",
    "need",
    "seeking",
    "hiring",
    "wanted",
    "commission",
    "project",
    "help with",
  ];

  const hasClientKeywords = clientKeywords.some((phrase) =>
    titleLower.includes(phrase)
  );
  if (!hasClientKeywords && forHireScore > 0) {
    forHireScore += 1;
  }

  // DÉCISION FINALE
  if (forHireScore >= 4) {
    console.log(
      `🚫 For Hire détecté (score: ${forHireScore}): "${title.substring(
        0,
        60
      )}..."`
    );
    return true;
  }

  return false;
};

// 🆕 FONCTION POUR DÉTECTER LES VRAIS CLIENTS QUI CHERCHENT DES ARTISTES
const isValidHiringPost = (title, description, flair) => {
  const titleLower = title.toLowerCase();
  const descLower = (description || "").toLowerCase();
  const fullText = titleLower + " " + descLower;

  // SIGNAUX POSITIFS (Client cherche artiste)
  const hiringSignals = [
    "looking for",
    "need",
    "seeking",
    "hiring",
    "wanted",
    "in search of",
    "require",
    "help with",
    "commission",
    "project for",
    "artist needed",
    "anyone available",
    "can someone",
    "would like to hire",
  ];

  // CONTEXTE CLIENT
  const clientContext = [
    "my project",
    "our project",
    "my game",
    "our game",
    "my book",
    "my character",
    "my story",
    "my campaign",
    "for my",
    "for our",
    "client needs",
    "budget of",
    "willing to pay",
    "can pay",
  ];

  // STRUCTURES DE BRIEF
  const briefStructures = [
    "description:",
    "what i need:",
    "requirements:",
    "project details:",
    "looking for someone who",
    "need someone to",
  ];

  let hiringScore = 0;

  // Vérifier signaux d'embauche
  if (hiringSignals.some((signal) => fullText.includes(signal))) {
    hiringScore += 3;
  }

  // Vérifier contexte client
  if (clientContext.some((context) => fullText.includes(context))) {
    hiringScore += 2;
  }

  // Vérifier structure de brief
  if (briefStructures.some((structure) => fullText.includes(structure))) {
    hiringScore += 2;
  }

  // Bonus pour flair approprié
  if (flair && (flair.includes("hiring") || flair.includes("patron"))) {
    hiringScore += 2;
  }

  return hiringScore >= 3;
};

// 🆕 FONCTION POUR VÉRIFIER SI LES COMMENTAIRES SONT DISPONIBLES
const checkCommentAvailability = (submission) => {
  const now = Date.now();
  const postAge = now - submission.created_utc * 1000;
  const ageInHours = postAge / (1000 * 60 * 60);
  const ageInMonths = postAge / (1000 * 60 * 60 * 24 * 30);

  return {
    canComment:
      !submission.locked &&
      !submission.archived &&
      !submission.removed &&
      ageInMonths < 6,
    locked: submission.locked,
    archived: submission.archived,
    removed: submission.removed,
    tooOld: ageInMonths > 6,
    ageInHours: Math.floor(ageInHours),
    status: getCommentStatus(submission, ageInMonths),
  };
};

const getCommentStatus = (submission, ageInMonths) => {
  if (submission.removed) return "SUPPRIMÉ";
  if (submission.locked) return "VERROUILLÉ";
  if (submission.archived || ageInMonths > 6) return "ARCHIVÉ";
  return "OUVERT";
};

export const getReddit = async () => {
  try {
    // Vérifier que les variables d'environnement sont présentes
    if (
      !process.env.username ||
      !process.env.password ||
      !process.env.clientId ||
      !process.env.clientSecret
    ) {
      throw new Error("Variables d'environnement Reddit manquantes");
    }

    const config = {
      username: process.env.username,
      password: process.env.password,
      clientId: process.env.clientId,
      clientSecret: process.env.clientSecret,
    };

    const r = new snoowrap({
      userAgent: "ArtJobBot/1.0.0 by YourUsername", // Changez "YourUsername" par votre nom d'utilisateur Reddit
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      username: config.username,
      password: config.password,
    });

    // Configuration des subreddits avec leurs paramètres spécifiques
    const subredditConfigs = [
      {
        name: "HungryArtists",
        params: {
          query: 'flair:"Hiring" -flair:"For Hire"',
          sort: "new",
          restrict_sr: "on",
          limit: 10,
        },
      },
      {
        name: "artcommissions",
        params: {
          query: 'flair:"[Patron]" OR (hiring NOT "for hire")',
          sort: "new",
          restrict_sr: "on",
          limit: 10,
        },
      },
      {
        name: "starvingartists",
        params: {
          query: '(Request OR Hiring OR Commission) -"For Hire" -"for hire"',
          sort: "new",
          restrict_sr: "on",
          limit: 8,
        },
      },
      {
        name: "hireanartist",
        params: {
          query: 'flair:"[Hiring]-project" OR flair:"[Hiring]-one-off"',
          sort: "new",
          restrict_sr: "on",
          limit: 10,
        },
      },
    ];

    console.log("🔍 Recherche sur les subreddits...");

    // Collecter toutes les offres
    const allJobs = [];

    for (const config of subredditConfigs) {
      try {
        console.log(`📡 Recherche sur r/${config.name}...`);

        const posts = await r.getSubreddit(config.name).search(config.params);

        const jobs = posts
          .filter((submission) => {
            const title = submission.title;
            const description = submission.selftext || "";
            const flair = submission.link_flair_text || "";

            // 🆕 NOUVEAU FILTRE RENFORCÉ
            // 1. Éliminer les For Hire déguisés
            if (isForHirePost(title, description, flair)) {
              return false;
            }

            // 2. Garder seulement les vrais posts d'embauche
            if (!isValidHiringPost(title, description, flair)) {
              console.log(
                `⏭️ Pas un post d'embauche: "${title.substring(0, 50)}..."`
              );
              return false;
            }

            // 3. Vérifier les commentaires ouverts
            const commentStatus = checkCommentAvailability(submission);
            if (!commentStatus.canComment) {
              console.log(
                `⏭️ Commentaires fermés (${
                  commentStatus.status
                }): ${title.substring(0, 50)}...`
              );
              return false;
            }

            // 4. Filtres de base existants
            if (submission.over_18) {
              return false;
            }

            const hoursAgo = Math.floor(
              (Date.now() - submission.created_utc * 1000) / (1000 * 60 * 60)
            );
            if (hoursAgo > 120) {
              return false; // Ignorer si plus vieux que 5 jours
            }

            // 5. Vérifier la pertinence
            const relevanceScore = scoreJobRelevance(title, description);
            if (relevanceScore <= 0) {
              console.log(
                `⏭️ Score trop bas (${relevanceScore}): ${title.substring(
                  0,
                  50
                )}...`
              );
              return false;
            }

            return true;
          })
          .map((submission) => {
            const description = submission.selftext || "";
            const baseRelevanceScore = scoreJobRelevance(
              submission.title,
              description
            );
            const hoursAgo = Math.floor(
              (Date.now() - submission.created_utc * 1000) / (1000 * 60 * 60)
            );

            // 🆕 AJOUTER LES INFOS DE COMMENTAIRES
            const commentInfo = checkCommentAvailability(submission);

            // Ajuster le score avec timing et concurrence
            const finalScore = adjustScoreForTimingAndCompetition(
              baseRelevanceScore,
              hoursAgo,
              submission.num_comments,
              commentInfo.canComment // 🆕 NOUVEAU PARAMÈTRE
            );

            return {
              title: submission.title,
              url: `https://www.reddit.com${submission.permalink}`,
              subreddit: config.name,
              created: submission.created_utc,
              score: submission.score,
              author: submission.author.name,
              description: description,
              relevanceScore: finalScore, // Score final ajusté
              baseScore: baseRelevanceScore, // Score de base pour référence
              numComments: submission.num_comments,
              createdDate: new Date(submission.created_utc * 1000),
              hoursAgo: hoursAgo,

              // 🆕 NOUVELLES DONNÉES COMMENTAIRES
              commentStatus: commentInfo.status,
              canComment: commentInfo.canComment,
              isLocked: commentInfo.locked,
              isArchived: commentInfo.archived,
              isRemoved: commentInfo.removed,
            };
          });

        console.log(`✅ r/${config.name}: ${jobs.length} offres trouvées`);
        allJobs.push(...jobs);

        // Petite pause entre les requêtes pour respecter les limites API
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ Erreur sur r/${config.name}:`, error.message);
        // Continuer avec les autres subreddits même si un échoue
      }
    }

    // Trier par score de pertinence D'ABORD, puis par date
    const sortedJobs = allJobs.sort((a, b) => {
      // Priorité au score de pertinence
      if (a.relevanceScore !== b.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      // Si même score, trier par date
      return b.created - a.created;
    });

    // Supprimer les doublons basés sur le titre (certaines offres peuvent être cross-postées)
    const uniqueJobs = [];
    const seenTitles = new Set();

    for (const job of sortedJobs) {
      const normalizedTitle = job.title.toLowerCase().trim();
      if (!seenTitles.has(normalizedTitle)) {
        seenTitles.add(normalizedTitle);
        uniqueJobs.push({
          title: job.title,
          url: job.url,
          subreddit: job.subreddit,
          relevanceScore: job.relevanceScore,
          description: job.description,
          numComments: job.numComments,
          createdDate: job.createdDate,
          hoursAgo: job.hoursAgo,
          // 🆕 NOUVELLES PROPRIÉTÉS
          commentStatus: job.commentStatus,
          canComment: job.canComment,
          isLocked: job.isLocked,
          isArchived: job.isArchived,
          isRemoved: job.isRemoved,
        });
      }
    }

    console.log(`🎯 Total: ${uniqueJobs.length} offres uniques trouvées`);

    return uniqueJobs;
  } catch (error) {
    console.error("❌ Erreur getReddit:", error);

    // Log plus détaillé pour le debugging
    if (error.message.includes("401")) {
      console.error(
        "🔐 Erreur d'authentification Reddit - Vérifiez vos identifiants"
      );
    } else if (error.message.includes("429")) {
      console.error("⏰ Rate limit atteint - Trop de requêtes");
    } else if (error.message.includes("ENOTFOUND")) {
      console.error("🌐 Problème de connexion internet");
    }

    return "error";
  }
};

export const getRedditForced = async () => {
  try {
    if (
      !process.env.username ||
      !process.env.password ||
      !process.env.clientId ||
      !process.env.clientSecret
    ) {
      throw new Error("Variables d'environnement Reddit manquantes");
    }

    const config = {
      username: process.env.username,
      password: process.env.password,
      clientId: process.env.clientId,
      clientSecret: process.env.clientSecret,
    };

    const r = new snoowrap({
      userAgent: "ArtJobBot/1.0.0 by YourUsername",
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      username: config.username,
      password: config.password,
    });

    // Recherche plus large pour avoir des résultats même anciens
    const subredditConfigs = [
      {
        name: "HungryArtists",
        params: {
          query: "art OR artist OR illustration OR commission", // Plus large
          sort: "new",
          restrict_sr: "on",
          limit: 15,
          t: "week", // Dernière semaine
        },
      },
      {
        name: "DMAcademy", // Subreddit supplémentaire pour tests
        params: {
          query: "art OR commission",
          sort: "new",
          restrict_sr: "on",
          limit: 10,
          t: "month",
        },
      },
    ];

    console.log("🔍 Recherche FORCÉE sur les subreddits...");

    const allJobs = [];

    for (const config of subredditConfigs) {
      try {
        console.log(`📡 Recherche forcée sur r/${config.name}...`);

        const posts = await r.getSubreddit(config.name).search(config.params);

        const jobs = posts.map((submission) => {
          const description = submission.selftext || "";
          const relevanceScore = scoreJobRelevance(
            submission.title,
            description
          );

          const hoursAgo = Math.floor(
            (Date.now() - submission.created_utc * 1000) / (1000 * 60 * 60)
          );

          return {
            title: submission.title,
            url: `https://www.reddit.com${submission.permalink}`,
            subreddit: config.name,
            created: submission.created_utc,
            score: submission.score,
            author: submission.author.name,
            description: description,
            relevanceScore: relevanceScore,
            numComments: submission.num_comments,
            createdDate: new Date(submission.created_utc * 1000),
            hoursAgo: hoursAgo,
          };
        });

        console.log(
          `✅ r/${config.name}: ${jobs.length} offres trouvées (forcées)`
        );
        allJobs.push(...jobs);

        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ Erreur sur r/${config.name}:`, error.message);
      }
    }

    // Trier par score de pertinence
    const sortedJobs = allJobs.sort(
      (a, b) => b.relevanceScore - a.relevanceScore
    );

    console.log(`🎯 Total forcé: ${sortedJobs.length} offres trouvées`);

    return sortedJobs;
  } catch (error) {
    console.error("❌ Erreur getRedditForced:", error);
    return "error";
  }
};

// 🆕 EXPORT DES NOUVELLES FONCTIONS POUR DEBUGGING
export {
  isForHirePost,
  isValidHiringPost,
  checkCommentAvailability,
  detectProjectStatus,
};
