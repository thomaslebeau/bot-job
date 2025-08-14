/* eslint quotes: "off" */
import snoowrap from "snoowrap";

const negationWords = ["not", "haven't", "hasn't", "didn't", "never", "no"];

function hasPositiveKeyword(text, keyword) {
  const index = text.indexOf(keyword);
  if (index === -1) return false;

  // Vérifier les mots avant le keyword
  const precedingText = text.substring(Math.max(0, index - 30), index);
  return !negationWords.some(neg => precedingText.includes(neg));
}

// Fonction pour scorer la pertinence selon vos spécialités RÉELLES
const scoreJobRelevance = (title, description = "") => {
  const text = (title + " " + description).toLowerCase();
  let score = 0;

  // VOS SPÉCIALITÉS PRIORITAIRES
  const highPriorityKeywords = {
    // CHARACTER DESIGN (votre cœur de métier)
    "character design": 25,
    "character concept": 22,
    "character art": 20,
    "character sheet": 18,
    "reference sheet": 16,
    "character portrait": 16,
    "original character": 14,
    "character illustration": 15,

    // D&D / FANTASY RPG (votre marché principal)
    dnd: 20,
    "d&d": 20,
    "dungeons and dragons": 20,
    "fantasy character": 18,
    "rpg character": 16,
    pathfinder: 15,
    ttrpg: 15,
    fantasy: 12,
    medieval: 10,

    // PROJETS MULTIPLES (meilleurs budgets)
    "multiple characters": 15,
    "party commission": 14,
    "group commission": 12,
    "several characters": 12,
    "character roster": 10,

    // VOTRE STYLE SEMI-RÉALISTE
    "semi realistic": 15,
    "semi-realistic": 15,
    "semi realism": 15,
    stylized: 12,
    painterly: 10,
    "concept art": 10,

    // CONTEXTES FANTASY PREMIUM
    "dark fantasy": 12,
    "high fantasy": 10,
    "epic fantasy": 10,
    "sword and sorcery": 8,
    gothic: 8,

    // CLASSES/RACES D&D POPULAIRES
    paladin: 8,
    wizard: 8,
    rogue: 8,
    barbarian: 8,
    warlock: 8,
    druid: 8,
    ranger: 8,
    elf: 6,
    dwarf: 6,
    tiefling: 8,
    dragonborn: 8,

    // PROJETS LONG TERME (meilleurs clients)
    "long term": 12,
    ongoing: 10,
    series: 8,
    campaign: 8,
    "regular work": 10
  };

  // Styles/types à éviter ou moins compatibles avec vos compétences
  const avoidKeywords = {
    anime: -15,
    manga: -15,
    chibi: -20,
    kawaii: -15,
    cartoon: -8,
    "cel shading": -10,

    // Projets non-character
    landscape: -12,
    environment: -10,
    logo: -20,
    website: -15,
    "ui/ux": -20,
    "graphic design": -15,
    banner: -8,
    poster: -6,

    // Budgets dérisoires (élimination immédiate)
    $10: -25,
    $15: -25,
    $20: -20,
    $25: -18,
    $30: -15,
    $40: -12,
    $50: -10,
    "very low budget": -15,
    "student budget": -10,
    "tight budget": -8,
    "limited budget": -6,

    // Styles réalistes (trop complexes pour vos tarifs)
    photorealistic: -15,
    hyperrealistic: -18,
    "realistic portrait": -12,

    // Autres incompatibilités
    furry: -8,
    nsfw: -10,
    "adult content": -12
  };

  // Bonus spéciaux pour creature design
  const creatureBonusKeywords = {
    "generous budget": 8,
    "good budget": 6,
    "professional rate": 8,
    "fair compensation": 6,
    "competitive rate": 5,
    "quality work": 4,
    "experienced artist": 5,
    "portfolio required": 4,
    "professional artist": 6,
    "commercial use": 5,
    "copyright transfer": 4,
    "exclusive rights": 6
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
    if (budget < 150) {
      score -= 20; // ÉLIMINATION : en dessous de votre minimum
    } else if (budget >= 150 && budget < 200) {
      score += 5; // Minimum acceptable
    } else if (budget >= 200 && budget < 300) {
      score += 8; // Bon budget
    } else if (budget >= 300 && budget < 500) {
      score += 12; // Très bon budget
    } else if (budget >= 500) {
      score += 15; // Budget premium
    }
  }

  if (text.includes("character") || text.includes("portrait")) {
    // Bonus supplémentaires si c'est vraiment du character design
    if (text.includes("backstory") || text.includes("personality")) score += 3;
    if (text.includes("multiple views") || text.includes("turnaround")) score += 4;
    if (text.includes("armor") || text.includes("weapon")) score += 3;
    if (text.includes("class") || text.includes("race")) score += 3;
    if (text.includes("level") || text.includes("stats")) score += 2;
  }

  // Malus pour urgence (creature design = temps nécessaire)
  if (text.includes("asap") || text.includes("urgent") || text.includes("rush")) {
    score -= 5;
  }
  if (text.includes("24 hours") || text.includes("tomorrow")) {
    score -= 8;
  }

  // Bonus pour timeline réaliste
  if (
    text.includes("flexible deadline") ||
    text.includes("no rush") ||
    text.includes("take your time") ||
    text.includes("when ready")
  ) {
    score += 4;
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

const detectProjectStatus = async submission => {
  // Les propriétés snoowrap sont déjà des valeurs, pas des Promises
  const titleRaw = await submission.title;
  const selftextRaw = await submission.selftext;
  const flairRaw = await submission.link_flair_text;

  const title = (titleRaw || "").toString().toLowerCase();
  const description = (selftextRaw || "").toString().toLowerCase();
  const flair = (flairRaw || "").toString().toLowerCase();
  const fullText = title + " " + description + " " + flair;

  console.log(`🔍 Analyse statut pour: "${title.substring(0, 50)}..."`);

  // 🆕 VÉRIFIER SI LE POST EST SUPPRIMÉ FIRST
  const isDeleted =
    description === "[deleted]" ||
    description === "[removed]" ||
    submission.author?.name === "[deleted]" ||
    submission.removed_by_category === "deleted" ||
    submission.removed === true;

  if (isDeleted) {
    console.log(`🗑️ Post supprimé détecté: ${isDeleted ? "Oui" : "Non"}`);
    return {
      isClosed: true,
      isInProgress: false,
      isDeleted: true,
      status: "SUPPRIMÉ",
      reason: description === "[deleted]" ? "USER_DELETED" : "MOD_REMOVED",
      details: {
        deletedByUser: description === "[deleted]" || submission.author?.name === "[deleted]",
        removedByMods: submission.removed === true
      },
      updateInfo: null
    };
  }

  // Mots-clés indiquant que l'artiste a été trouvé (FERMÉ)
  const foundKeywords = [
    "found",
    "artist found",
    "position filled",
    "no longer accepting",
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
    "hired an artist",
    "selected an artist"
  ];

  // 🆕 DÉTECTION DES UPDATE (statut EN_COURS)
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
    "almost decided"
  ];

  // Patterns spécifiques pour FERMÉ
  const foundPatterns = [
    /\[found\]/i,
    /\[filled\]/i,
    /\[closed\]/i,
    /\[hired\]/i,
    /\[complete\]/i,
    /edit.*found/i,
    /update.*found/i,
    /edit.*filled/i,
    /update.*filled/i,
    /edit.*hired/i,
    /update.*hired/i,
    /thanks.*everyone.*found/i,
    /thank.*you.*all.*found/i,
    /going with.*artist/i,
    /chosen.*artist/i,
    /selected.*artist/i,
    /artist (found|selected)/i,
    /(position|slot).*(filled|taken)/i,
    /(closed).*applications/i
  ];

  // 🆕 PATTERNS POUR UPDATE/EN_COURS
  const updatePatterns = [
    /update:.*going through/i,
    /edit:.*going through/i,
    /update:.*reviewing/i,
    /edit:.*reviewing/i,
    /update:.*reaching out/i,
    /edit:.*reaching out/i,
    /update:.*overwhelmed/i,
    /update:.*lots of/i,
    /update:.*many/i,
    /going through.*responses/i,
    /reviewing.*responses/i,
    /reaching out.*folks/i,
    /take.*couple.*days/i,
    /need.*more.*time/i,
    /still.*deciding/i,
    /making.*decision/i,
    /narrowing.*down/i,
    /shortlisting/i
  ];

  // Vérifier les différents états
  const hasFoundKeyword = foundKeywords.some(keyword => hasPositiveKeyword(fullText, keyword));
  const hasFoundPattern = foundPatterns.some(
    pattern => pattern.test(fullText) && hasPositiveKeyword(fullText, pattern.source)
  );

  const isTrulyClosedByFlair = ["hired", "closed", "filled", "completed", "finished"].some(term =>
    flair.includes(term)
  );

  const isAmbiguousFlair = ["found", "position"].some(term => flair.includes(term));

  const hasFoundFlair = isTrulyClosedByFlair || (isAmbiguousFlair && hasFoundKeyword);

  // 🆕 VÉRIFIER LES UPDATE
  const hasUpdateKeyword = updateKeywords.some(keyword => hasPositiveKeyword(fullText, keyword));
  const hasUpdatePattern = updatePatterns.some(
    pattern => pattern.test(fullText) && hasPositiveKeyword(fullText, pattern.source)
  );

  // Vérifier si c'est un update mais pas encore fermé
  const isInProgress =
    (hasUpdateKeyword || hasUpdatePattern) &&
    !hasFoundKeyword &&
    !hasFoundPattern &&
    !hasFoundFlair;

  const isProjectClosed = hasFoundKeyword || hasFoundPattern || hasFoundFlair;

  // 🆕 LOGGING POUR DEBUG
  if (hasFoundKeyword)
    console.log(`🔒 Keyword trouvé: ${foundKeywords.find(k => fullText.includes(k))}`);
  if (hasFoundPattern) console.log("🔒 Pattern trouvé: Oui");
  if (hasFoundFlair) console.log(`🔒 Flair trouvé: ${flair}`);
  if (hasUpdateKeyword)
    console.log(`📋 Update keyword: ${updateKeywords.find(k => fullText.includes(k))}`);
  if (hasUpdatePattern) console.log("📋 Update pattern: Oui");

  // Déterminer le statut
  let status = "OUVERT";
  let reason = "OPEN";

  if (isProjectClosed) {
    status = "FERMÉ";
    reason = hasFoundFlair ? "FLAIR_FOUND" : hasFoundPattern ? "PATTERN_FOUND" : "KEYWORD_FOUND";
  } else if (isInProgress) {
    status = "EN_COURS";
    reason = hasUpdatePattern ? "UPDATE_PATTERN" : "UPDATE_KEYWORD";
  }

  console.log(`🔍 Détection statut:
  Title: ${title.substring(0, 30)}...
  Flair: ${flair}
  Found keywords: ${foundKeywords.filter(k => fullText.includes(k)).join(", ") || "Aucun"}
  Update keywords: ${updateKeywords.filter(k => fullText.includes(k)).join(", ") || "Aucun"}
  Final status: ${status}`);

  return {
    isClosed: isProjectClosed,
    isInProgress: isInProgress,
    isDeleted: false,
    status: status,
    reason: reason,
    details: {
      foundInTitle: foundKeywords.some(keyword => title.includes(keyword)),
      foundInDescription: foundKeywords.some(keyword => description.includes(keyword)),
      foundInFlair: hasFoundFlair,
      foundPattern: hasFoundPattern,
      // 🆕 DÉTAILS UPDATE
      updateInTitle: updateKeywords.some(keyword => title.includes(keyword)),
      updateInDescription: updateKeywords.some(keyword => description.includes(keyword)),
      updatePattern: hasUpdatePattern,
      // 🆕 DÉTAILS SUPPRESSION
      deletedByUser: false,
      removedByMods: false
    },
    // 🆕 INFORMATIONS EXTRAITES DE L'UPDATE (SIMPLIFIÉES)
    updateInfo: isInProgress ? extractSimpleUpdateInfo(fullText) : null
  };
};

// 🆕 FONCTION SIMPLIFIÉE POUR EXTRAIRE LES INFOS D'UPDATE
const extractSimpleUpdateInfo = text => {
  const info = {
    timeline: null,
    responseCount: null,
    stage: null,
    notes: []
  };

  // Extraire timeline simple
  if (text.includes("couple days") || text.includes("couple of days")) {
    info.timeline = "couple of days";
  } else if (text.includes("few days")) {
    info.timeline = "few days";
  } else if (text.includes("week")) {
    info.timeline = "about a week";
  } else if (text.includes("soon")) {
    info.timeline = "soon";
  }

  // Extraire info sur les réponses
  if (text.includes("lots of responses") || text.includes("many responses")) {
    info.responseCount = "many responses";
  } else if (text.includes("overwhelmed")) {
    info.responseCount = "overwhelmed with responses";
  }

  // Déterminer l'étape
  if (text.includes("going through") || text.includes("reviewing")) {
    info.stage = "REVIEWING";
  } else if (text.includes("reaching out") || text.includes("contacting")) {
    info.stage = "CONTACTING";
  } else if (text.includes("deciding") || text.includes("choosing")) {
    info.stage = "DECIDING";
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
    "accepting commissions"
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
    "here's my"
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
    "shoot me a message"
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
    "more examples"
  ];

  // SCORING DES SIGNAUX FOR HIRE
  let forHireScore = 0;

  // Vérifier auto-promotion
  const hasAutoPromo = selfPromotion.some(phrase => titleLower.includes(phrase));
  if (hasAutoPromo) forHireScore += 3;

  // Vérifier appels à l'action
  const hasCallToAction = callsToAction.some(phrase => fullText.includes(phrase));
  if (hasCallToAction) forHireScore += 2;

  // Vérifier signaux commerciaux
  const hasCommercialSignal = commercialSignals.some(phrase => fullText.includes(phrase));
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
    "help with"
  ];

  const hasClientKeywords = clientKeywords.some(phrase => titleLower.includes(phrase));
  if (!hasClientKeywords && forHireScore > 0) {
    forHireScore += 1;
  }

  // DÉCISION FINALE
  if (forHireScore >= 4) {
    console.log(`🚫 For Hire détecté (score: ${forHireScore}): "${title.substring(0, 60)}..."`);
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
    "would like to hire"
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
    "can pay"
  ];

  // STRUCTURES DE BRIEF
  const briefStructures = [
    "description:",
    "what i need:",
    "requirements:",
    "project details:",
    "looking for someone who",
    "need someone to"
  ];

  let hiringScore = 0;

  // Vérifier signaux d'embauche
  if (hiringSignals.some(signal => fullText.includes(signal))) {
    hiringScore += 3;
  }

  // Vérifier contexte client
  if (clientContext.some(context => fullText.includes(context))) {
    hiringScore += 2;
  }

  // Vérifier structure de brief
  if (briefStructures.some(structure => fullText.includes(structure))) {
    hiringScore += 2;
  }

  // Bonus pour flair approprié
  if (flair && (flair.includes("hiring") || flair.includes("patron"))) {
    hiringScore += 2;
  }

  return hiringScore >= 3;
};

// 🆕 FONCTION POUR VÉRIFIER SI LES COMMENTAIRES SONT DISPONIBLES
const checkCommentAvailability = submission => {
  const now = Date.now();
  const postAge = now - submission.created_utc * 1000;
  const ageInHours = postAge / (1000 * 60 * 60);
  const ageInMonths = postAge / (1000 * 60 * 60 * 24 * 30);

  return {
    canComment:
      !submission.locked && !submission.archived && !submission.removed && ageInMonths < 6,
    locked: submission.locked,
    archived: submission.archived,
    removed: submission.removed,
    tooOld: ageInMonths > 6,
    ageInHours: Math.floor(ageInHours),
    status: getCommentStatus(submission, ageInMonths)
  };
};

const getCommentStatus = (submission, ageInMonths) => {
  if (submission.removed) return "SUPPRIMÉ";
  if (submission.locked) return "VERROUILLÉ";
  if (submission.archived || ageInMonths > 6) return "ARCHIVÉ";
  return "OUVERT";
};

const generateAutoResponse = () => {
  return `Hi there!

Freelance character artist here with a focus on fantasy and TTRPG artwork. I specialize in semi-realistic character design that captures both visual appeal and personality.

I'm passionate about bringing unique characters to life. My Portfolio: https://www.artstation.com/courgette-tl
Happy to discuss your project via DM!`;
};

const autoApplyToJob = async (r, job) => {
  try {
    console.log(`🤖 Auto-candidature pour: "${job.title.substring(0, 50)}..."`);

    // Extraire l'ID du post depuis l'URL
    const postId = job.url.split("/comments/")[1].split("/")[0];

    // Générer le message
    const message = generateAutoResponse(job.title, job.subreddit);

    // Poster le commentaire
    const submission = await r.getSubmission(postId);
    await submission.reply(message);

    console.log(`✅ Candidature automatique envoyée pour: ${job.title.substring(0, 50)}...`);

    // Délai de sécurité pour éviter le spam
    await new Promise(resolve => setTimeout(resolve, 5000)); // 5 secondes

    return true;
  } catch (error) {
    console.error(`❌ Erreur auto-candidature pour "${job.title}":`, error.message);
    return false;
  }
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
      clientSecret: process.env.clientSecret
    };

    const r = new snoowrap({
      userAgent: "ArtJobBot/1.0.0 by YourUsername", // Changez "YourUsername" par votre nom d'utilisateur Reddit
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      username: config.username,
      password: config.password
    });

    // Configuration des subreddits avec leurs paramètres spécifiques
    const subredditConfigs = [
      {
        name: "HungryArtists",
        params: {
          query: `flair:"Hiring" -flair:"For Hire"`,
          sort: "new",
          restrict_sr: "on",
          limit: 10
        }
      },
      {
        name: "artcommissions",
        params: {
          query: `flair:"[Patron]" OR (hiring NOT "for hire")`,
          sort: "new",
          restrict_sr: "on",
          limit: 10
        }
      },
      {
        name: "starvingartists",
        params: {
          query: `(Request OR Hiring OR Commission) -"For Hire" -"for hire"`,
          sort: "new",
          restrict_sr: "on",
          limit: 8
        }
      },
      {
        name: "hireanartist",
        params: {
          query: `flair:"[Hiring]-project" OR flair:"[Hiring]-one-off"`,
          sort: "new",
          restrict_sr: "on",
          limit: 10
        }
      }
    ];

    console.log("🔍 Recherche sur les subreddits...");

    // Collecter toutes les offres
    const allJobs = [];

    for (const config of subredditConfigs) {
      try {
        console.log(`📡 Recherche sur r/${config.name}...`);

        const posts = await r.getSubreddit(config.name).search(config.params);

        const jobs = posts
          .filter(submission => {
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
              console.log(`⏭️ Pas un post d'embauche: "${title.substring(0, 50)}..."`);
              return false;
            }

            // 3. Vérifier les commentaires ouverts
            const commentStatus = checkCommentAvailability(submission);
            if (!commentStatus.canComment) {
              console.log(
                `⏭️ Commentaires fermés (${commentStatus.status}): ${title.substring(0, 50)}...`
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
              console.log(`⏭️ Score trop bas (${relevanceScore}): ${title.substring(0, 50)}...`);
              return false;
            }

            return true;
          })
          .map(async submission => {
            const description = submission.selftext || "";
            const baseRelevanceScore = scoreJobRelevance(submission.title, description);
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
              isRemoved: commentInfo.removed
            };
          });

        console.log(`✅ r/${config.name}: ${jobs.length} offres trouvées`);
        allJobs.push(...jobs);

        // Petite pause entre les requêtes pour respecter les limites API
        await new Promise(resolve => setTimeout(resolve, 1000));
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

    for (const jobPromise of sortedJobs) {
      const job = await jobPromise;
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
          isRemoved: job.isRemoved
        });
      }
    }

    console.log(`🎯 Total: ${uniqueJobs.length} offres uniques trouvées`);

    return uniqueJobs;
  } catch (error) {
    console.error("❌ Erreur getReddit:", error);

    // Log plus détaillé pour le debugging
    if (error.message.includes("401")) {
      console.error("🔐 Erreur d'authentification Reddit - Vérifiez vos identifiants");
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
      clientSecret: process.env.clientSecret
    };

    const r = new snoowrap({
      userAgent: "ArtJobBot/1.0.0 by YourUsername",
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      username: config.username,
      password: config.password
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
          t: "week" // Dernière semaine
        }
      },
      {
        name: "DMAcademy", // Subreddit supplémentaire pour tests
        params: {
          query: "art OR commission",
          sort: "new",
          restrict_sr: "on",
          limit: 10,
          t: "month"
        }
      }
    ];

    console.log("🔍 Recherche FORCÉE sur les subreddits...");

    const allJobs = [];

    for (const config of subredditConfigs) {
      try {
        console.log(`📡 Recherche forcée sur r/${config.name}...`);

        const posts = await r.getSubreddit(config.name).search(config.params);

        const jobs = posts.map(submission => {
          const description = submission.selftext || "";
          const relevanceScore = scoreJobRelevance(submission.title, description);

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
            hoursAgo: hoursAgo
          };
        });

        console.log(`✅ r/${config.name}: ${jobs.length} offres trouvées (forcées)`);
        allJobs.push(...jobs);

        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ Erreur sur r/${config.name}:`, error.message);
      }
    }

    // Trier par score de pertinence
    const sortedJobs = allJobs.sort((a, b) => b.relevanceScore - a.relevanceScore);

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
  autoApplyToJob
};
