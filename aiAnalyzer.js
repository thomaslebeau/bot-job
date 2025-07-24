import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Votre profil artistique - PERSONNALISEZ CES INFORMATIONS
const ARTIST_PROFILE = {
  name: process.env.ARTIST_NAME || "Your Name",
  specialties: [
    "Creature Design",
    "Monster Design",
    "Character Design",
    "D&D/RPG Art",
    "Semi-realistic art",
    "Stylized illustrations",
    "Fantasy concept art",
  ],
  styles: [
    "Semi-realistic",
    "Stylized",
    "Fantasy art",
    "Concept art",
    "Digital painting",
    "Dark fantasy",
    "Painterly style",
  ],
  // 🔧 EXPÉRIENCE PLUS GÉNÉRALE ET VRAIE
  experience: [
    "Professional digital artist specializing in creature design",
    "Character design for fantasy settings",
    "Monster and creature concepts",
    "Semi-realistic and stylized art",
    "Fantasy illustration work",
    "Concept art development",
    "TCG card game for Genesis Battle of Champions",
  ],
  portfolio: process.env.PORTFOLIO_URL || "https://votre-portfolio.com",

  // 🔧 PROJETS GÉNÉRIQUES (PAS DE FAUSSES RÉFÉRENCES SPÉCIFIQUES)
  generalExperience: [
    "Creature design and concept development",
    "Character illustrations for fantasy settings",
    "Monster and beast designs",
    "Semi-realistic digital art",
    "Stylized fantasy illustrations",
  ],
};

// Template de prompt optimisé pour Groq
const createAnalysisPrompt = (
  title,
  description,
  subreddit,
  budget,
  relevanceScore
) => {
  // Détecter la langue du post
  const fullText = title + " " + description;
  const isEnglish =
    /^[\x00-\x7F]*$/.test(fullText) ||
    fullText.toLowerCase().includes("looking for") ||
    fullText.toLowerCase().includes("need") ||
    fullText.toLowerCase().includes("hiring");

  const language = isEnglish ? "English" : "French";

  // Analyser le type de projet
  const projectType = analyzeProjectType(title, description);
  const urgencyLevel =
    relevanceScore >= 18
      ? "HIGH PRIORITY"
      : relevanceScore >= 15
      ? "MEDIUM PRIORITY"
      : "STANDARD PRIORITY";

  return `You are writing a professional response for ${ARTIST_PROFILE.name}, a creature design and character design specialist.

ARTIST PROFILE:
Name: ${ARTIST_PROFILE.name}
Specialties: Creature Design, Character Design, D&D/RPG Art, Semi-realistic/Stylized art
Portfolio: ${ARTIST_PROFILE.portfolio}
Experience: Professional digital artist specializing in fantasy creature and character design

JOB POST TO ANALYZE:
Title: "${title}"
Description: "${description}"
Subreddit: r/${subreddit}
Budget: ${budget}
Project Type: ${projectType}
Priority: ${urgencyLevel}

RESPONSE REQUIREMENTS:
1. Language: Write ONLY in ${language}
2. Length: Maximum 150 words
3. Tone: Professional but friendly, confident without being pushy
4. Structure: Brief intro → relevant experience → approach → portfolio link → simple closing

CRITICAL RULES:
- Do NOT invent fake projects or experiences
- Do NOT use clichés like "thrilled", "perfect fit", "excited to work"
- Do NOT be overly formal or robotic
- ALWAYS include the portfolio link: ${ARTIST_PROFILE.portfolio}
- Show you READ and UNDERSTOOD their specific brief
- Be concise and direct

FORBIDDEN PHRASES:
- "I'm thrilled/excited"
- "This is a perfect fit"
- "I would be delighted"
- "I am confident I can"
- Any fake project references

Example structure:
"Hi! [Brief acknowledgment of their project]
I specialize in [relevant specialty] with a [style] approach that could work well for [their specific need].
My experience includes [real general experience areas].
You can see my work at [portfolio]
[Simple question or next step]
Best regards"

Generate ONLY the response, no explanation.`;
};
// Analyser le type de projet
const analyzeProjectType = (title, description) => {
  const text = (title + " " + description).toLowerCase();

  if (
    text.includes("creature") ||
    text.includes("monster") ||
    text.includes("beast")
  ) {
    return "Creature Design";
  } else if (
    text.includes("character") &&
    (text.includes("design") || text.includes("concept"))
  ) {
    return "Character Design";
  } else if (
    text.includes("dnd") ||
    text.includes("d&d") ||
    text.includes("pathfinder")
  ) {
    return "D&D/RPG Commission";
  } else if (
    text.includes("board game") ||
    text.includes("card game") ||
    text.includes("tcg")
  ) {
    return "Game Art Commission";
  } else if (text.includes("illustration") || text.includes("artwork")) {
    return "Fantasy Illustration";
  }

  return "Art Commission";
};

// Déterminer la spécialité correspondante
const determineSpecialtyMatch = (title, description) => {
  const text = (title + " " + description).toLowerCase();

  // Score de correspondance par spécialité
  const specialtyScores = {
    "Creature Design": 0,
    "Character Design": 0,
    "D&D/RPG Art": 0,
    "Game Art": 0,
    "Fantasy Illustration": 0,
  };

  // Mots-clés pour creature design
  const creatureKeywords = [
    "creature",
    "monster",
    "beast",
    "dragon",
    "demon",
    "familiar",
    "companion",
  ];
  creatureKeywords.forEach((keyword) => {
    if (text.includes(keyword)) specialtyScores["Creature Design"] += 3;
  });

  // Mots-clés pour character design
  const characterKeywords = [
    "character",
    "portrait",
    "person",
    "hero",
    "protagonist",
  ];
  characterKeywords.forEach((keyword) => {
    if (text.includes(keyword)) specialtyScores["Character Design"] += 2;
  });

  // Mots-clés pour D&D/RPG
  const dndKeywords = [
    "dnd",
    "d&d",
    "pathfinder",
    "rpg",
    "campaign",
    "homebrew",
  ];
  dndKeywords.forEach((keyword) => {
    if (text.includes(keyword)) specialtyScores["D&D/RPG Art"] += 3;
  });

  // Mots-clés pour game art
  const gameKeywords = ["game", "board", "card", "tcg", "kickstarter"];
  gameKeywords.forEach((keyword) => {
    if (text.includes(keyword)) specialtyScores["Game Art"] += 2;
  });

  // Retourner la spécialité avec le meilleur score
  const bestMatch = Object.entries(specialtyScores).reduce((a, b) =>
    specialtyScores[a[0]] > specialtyScores[b[0]] ? a : b
  );

  return bestMatch[1] > 0 ? bestMatch[0] : "Art généraliste";
};

// Suggérer la section portfolio pertinente
const suggestRelevantPortfolioSection = (title) => {
  const titleLower = title.toLowerCase();

  const portfolioSections = {
    "creature-design": ["creature", "monster", "beast", "dragon", "demon"],
    "character-design": ["character", "portrait", "person"],
    "dnd-rpg": ["dnd", "d&d", "rpg", "pathfinder", "campaign"],
    "game-art": ["game", "card", "board", "tcg"],
    "fantasy-illustrations": ["fantasy", "medieval", "magic", "illustration"],
  };

  for (const [section, keywords] of Object.entries(portfolioSections)) {
    if (keywords.some((keyword) => titleLower.includes(keyword))) {
      return section;
    }
  }

  return "recent-work";
};

// Évaluer la qualité de la réponse générée
const assessResponseQuality = (response, originalTitle) => {
  let score = 5; // Score de base sur 10

  // Vérifier la longueur (ni trop court ni trop long)
  if (response.length >= 100 && response.length <= 300) score += 1;

  // Vérifier la mention du portfolio
  if (response.includes(ARTIST_PROFILE.portfolio)) score += 1;

  // Vérifier la personnalisation (référence au titre original)
  const titleWords = originalTitle.toLowerCase().split(" ");
  const hasPersonalization = titleWords.some(
    (word) => word.length > 3 && response.toLowerCase().includes(word)
  );
  if (hasPersonalization) score += 1;

  // Vérifier la structure (question ou call-to-action à la fin)
  if (response.includes("?") || response.toLowerCase().includes("feel free"))
    score += 1;

  // Éviter les clichés IA
  const cliches = [
    "perfect fit",
    "thrilled",
    "excited to work",
    "look no further",
  ];
  const hasCliche = cliches.some((cliche) =>
    response.toLowerCase().includes(cliche)
  );
  if (!hasCliche) score += 1;

  return Math.min(score, 10); // Cap à 10
};

// Réponse de secours si Groq échoue
const generateFallbackResponse = (jobData) => {
  const specialty = determineSpecialtyMatch(
    jobData.title,
    jobData.description || ""
  );
  const projectType = analyzeProjectType(
    jobData.title,
    jobData.description || ""
  );
  const experience = getRelevantExperienceExample(projectType);

  // Détecter la langue
  const fullText = jobData.title + " " + (jobData.description || "");
  const isEnglish =
    /^[\x00-\x7F]*$/.test(fullText) ||
    fullText.toLowerCase().includes("looking for") ||
    fullText.toLowerCase().includes("hiring");

  if (isEnglish) {
    return `Hi! Your ${projectType.toLowerCase()} project looks interesting. I specialize in ${specialty.toLowerCase()} with a semi-realistic, stylized approach.

My experience includes ${experience} and I focus on creating designs that are both visually appealing and functional for your needs.

You can see my work at ${ARTIST_PROFILE.portfolio}

Would love to discuss your vision further. What's your timeline looking like?

Best regards`;
  } else {
    return `Bonjour ! Votre projet de ${projectType.toLowerCase()} m'intéresse. Je me spécialise en ${specialty.toLowerCase()} avec une approche semi-réaliste et stylisée.

Mon expérience inclut ${experience} et je me concentre sur la création de designs visuellement attrayants et fonctionnels.

Vous pouvez voir mon travail sur ${ARTIST_PROFILE.portfolio}

J'aimerais discuter de votre vision. Quel est votre calendrier ?

Cordialement`;
  }
};

// Analyser plusieurs jobs en lot
export const analyzeMultipleJobs = async (jobs, maxAnalyses = 10) => {
  console.log(
    `🚀 [Groq] Analyse en lot: ${Math.min(jobs.length, maxAnalyses)} jobs`
  );

  const results = [];
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < Math.min(jobs.length, maxAnalyses); i++) {
    const job = jobs[i];

    try {
      const analysis = await analyzeJobWithAI(job);
      results.push({
        job: job,
        analysis: analysis,
      });

      if (analysis.success) successCount++;
      else errorCount++;

      // Pause courte (Groq est rapide mais respectons les limites)
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`❌ [Groq] Erreur analyse job ${i + 1}:`, error);
      errorCount++;

      results.push({
        job: job,
        analysis: {
          success: false,
          response: generateFallbackResponse(job),
          error: error.message,
          metadata: { provider: "Fallback" },
        },
      });
    }
  }

  console.log(
    `✅ [Groq] Analyses terminées: ${successCount} succès, ${errorCount} erreurs`
  );
  return results;
};

// Test de connexion Groq
export const testGroqConnection = async () => {
  try {
    console.log("🧪 [Groq] Test de connexion...");

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: "Test connection. Reply with exactly 'Connection OK'.",
        },
      ],
      model: "llama-3.1-8b-instant", // Modèle le plus rapide pour test
      max_tokens: 10,
    });

    const response = completion.choices[0].message.content.trim();
    console.log(`✅ [Groq] Réponse test: "${response}"`);

    return response.includes("Connection") || response.includes("OK");
  } catch (error) {
    console.error("❌ [Groq] Erreur test:", error);

    if (error.message.includes("API key")) {
      console.error("🔑 Vérifiez votre GROQ_API_KEY dans le fichier .env");
    }

    return false;
  }
};

const getRelevantExperienceExample = (projectType) => {
  const experienceMap = {
    "Creature Design": "creature and monster design work",
    "Character Design": "character design and illustration",
    "D&D/RPG Commission": "fantasy character and creature art",
    "Game Art Commission": "game art and character design",
    "Fantasy Illustration": "fantasy illustration and concept art",
  };

  return experienceMap[projectType] || "digital art and character design";
};

// Variables de tracking en mémoire
let usageStats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  totalTokens: 0,
  totalResponseTime: 0,
  firstRequest: null,
  lastRequest: null,
  errorTypes: {},
  dailyUsage: {},
  averageTokensPerRequest: 0,
};

// Fonction pour enregistrer une requête
const trackRequest = (success, tokens, responseTime, error = null) => {
  const now = new Date();
  const today = now.toISOString().split("T")[0]; // YYYY-MM-DD

  // Stats globales
  usageStats.totalRequests++;
  usageStats.totalTokens += tokens || 0;
  usageStats.totalResponseTime += responseTime || 0;
  usageStats.lastRequest = now;

  if (!usageStats.firstRequest) {
    usageStats.firstRequest = now;
  }

  if (success) {
    usageStats.successfulRequests++;
  } else {
    usageStats.failedRequests++;
    if (error) {
      usageStats.errorTypes[error] = (usageStats.errorTypes[error] || 0) + 1;
    }
  }

  // Stats quotidiennes
  if (!usageStats.dailyUsage[today]) {
    usageStats.dailyUsage[today] = {
      requests: 0,
      tokens: 0,
      successes: 0,
      failures: 0,
    };
  }

  usageStats.dailyUsage[today].requests++;
  usageStats.dailyUsage[today].tokens += tokens || 0;

  if (success) {
    usageStats.dailyUsage[today].successes++;
  } else {
    usageStats.dailyUsage[today].failures++;
  }

  // Calculer moyenne
  usageStats.averageTokensPerRequest =
    usageStats.totalRequests > 0
      ? Math.round(usageStats.totalTokens / usageStats.totalRequests)
      : 0;

  console.log(
    `📊 [Stats] Request logged: ${
      success ? "SUCCESS" : "FAILED"
    } | Tokens: ${tokens} | Time: ${responseTime}ms`
  );
};

// MODIFIEZ votre fonction analyzeJobWithAI existante
export const analyzeJobWithAI = async (jobData) => {
  const startTime = Date.now();
  let tokens = 0;
  let success = false;
  let errorMessage = null;

  try {
    console.log(`🚀 [Groq] Analyse pour: ${jobData.title.substring(0, 50)}...`);

    // Extraire le budget avec plus de précision
    const fullText = jobData.title + " " + (jobData.description || "");
    const budgetMatch = fullText.match(/\$(\d+(?:,\d+)*(?:\.\d+)?)/);
    const budget = budgetMatch ? `$${budgetMatch[1]}` : "Budget à discuter";

    const prompt = createAnalysisPrompt(
      jobData.title,
      jobData.description || "",
      jobData.subreddit,
      budget,
      jobData.relevanceScore
    );

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Tu es un expert en rédaction de réponses pour commissions artistiques. Tu écris au nom de ${ARTIST_PROFILE.name}, spécialiste en creature design et character design. Tes réponses sont professionnelles, personnalisées et montrent une vraie compréhension du brief client.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.1-8b-instant",
      max_tokens: 350,
      temperature: 0.8,
      top_p: 0.9,
    });

    const responseTime = Date.now() - startTime;
    const aiResponse = completion.choices[0].message.content.trim();
    tokens = completion.usage?.total_tokens || 0;
    success = true;

    // 📊 TRACKER LA REQUÊTE RÉUSSIE
    trackRequest(true, tokens, responseTime);

    console.log(
      `✅ [Groq] Réponse générée en ${responseTime}ms (${aiResponse.length} chars, ${tokens} tokens)`
    );

    const qualityScore = assessResponseQuality(aiResponse, jobData.title);

    return {
      success: true,
      response: aiResponse,
      analysis: {
        budget: budget,
        relevanceScore: jobData.relevanceScore,
        projectType: analyzeProjectType(jobData.title, jobData.description),
        specialtyMatch: determineSpecialtyMatch(
          jobData.title,
          jobData.description
        ),
        qualityScore: qualityScore,
        suggestedPortfolioSection: suggestRelevantPortfolioSection(
          jobData.title
        ),
      },
      metadata: {
        provider: "Groq",
        model: "llama-3.1-8b-instant",
        tokens: tokens,
        responseTime: responseTime,
        cost: 0,
      },
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    success = false;
    errorMessage = error.message;

    console.error("❌ [Groq] Erreur analyse:", error);

    // Messages d'erreur spécifiques
    if (error.code === "invalid_api_key") {
      errorMessage = "Clé API Groq invalide";
    } else if (error.code === "rate_limit_exceeded") {
      errorMessage = "Limite de taux Groq atteinte";
    }

    // 📊 TRACKER LA REQUÊTE ÉCHOUÉE
    trackRequest(false, tokens, responseTime, errorMessage);

    const fallbackResponse = generateFallbackResponse(jobData);

    return {
      success: false,
      response: fallbackResponse,
      error: errorMessage,
      analysis: {
        budget: "Erreur extraction",
        relevanceScore: jobData.relevanceScore,
        projectType: "Erreur analyse",
        specialtyMatch: "Analyse manuelle requise",
        qualityScore: 5,
        suggestedPortfolioSection: "portfolio complet",
      },
      metadata: {
        provider: "Fallback Template",
        model: "Template",
        tokens: 0,
        responseTime: responseTime,
        cost: 0,
      },
    };
  }
};

// NOUVELLE fonction pour obtenir les vraies statistiques
export const getGroqUsageStats = () => {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const todayStats = usageStats.dailyUsage[today] || {
    requests: 0,
    tokens: 0,
    successes: 0,
    failures: 0,
  };

  // Calculer uptime
  const uptimeMs = usageStats.firstRequest ? now - usageStats.firstRequest : 0;
  const uptimeHours = Math.floor(uptimeMs / (1000 * 60 * 60));

  // Calculer taux de succès
  const successRate =
    usageStats.totalRequests > 0
      ? Math.round(
          (usageStats.successfulRequests / usageStats.totalRequests) * 100
        )
      : 0;

  // Temps de réponse moyen
  const averageResponseTime =
    usageStats.successfulRequests > 0
      ? Math.round(usageStats.totalResponseTime / usageStats.successfulRequests)
      : 0;

  // Estimation tokens restants (Groq = 6000/minute)
  const tokensPerMinute =
    usageStats.totalRequests > 0 && uptimeMs > 0
      ? Math.round((usageStats.totalTokens * 60 * 1000) / uptimeMs)
      : 0;

  return {
    // Stats globales
    totalRequests: usageStats.totalRequests,
    successfulRequests: usageStats.successfulRequests,
    failedRequests: usageStats.failedRequests,
    successRate: successRate,

    // Stats tokens
    totalTokens: usageStats.totalTokens,
    averageTokensPerRequest: usageStats.averageTokensPerRequest,
    tokensPerMinute: tokensPerMinute,

    // Performance
    averageResponseTime: averageResponseTime,

    // Période
    firstRequest: usageStats.firstRequest,
    lastRequest: usageStats.lastRequest,
    uptimeHours: uptimeHours,

    // Aujourd'hui
    today: {
      date: today,
      requests: todayStats.requests,
      tokens: todayStats.tokens,
      successes: todayStats.successes,
      failures: todayStats.failures,
      successRate:
        todayStats.requests > 0
          ? Math.round((todayStats.successes / todayStats.requests) * 100)
          : 0,
    },

    // Erreurs
    errorTypes: usageStats.errorTypes,

    // Estimation coût (Groq gratuit)
    estimatedCost: 0,

    // Limite Groq
    groqLimits: {
      tokensPerMinute: 6000,
      remainingEstimate: Math.max(0, 6000 - tokensPerMinute),
      isNearLimit: tokensPerMinute > 5000,
    },
  };
};

// Fonction pour reset les stats (utile pour debug)
export const resetGroqStats = () => {
  usageStats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    totalTokens: 0,
    totalResponseTime: 0,
    firstRequest: null,
    lastRequest: null,
    errorTypes: {},
    dailyUsage: {},
    averageTokensPerRequest: 0,
  };
  console.log("🔄 [Stats] Statistiques Groq réinitialisées");
};

// Fonction pour obtenir un résumé quotidien
export const getDailyStatsReport = () => {
  const today = new Date().toISOString().split("T")[0];
  const todayStats = usageStats.dailyUsage[today];

  if (!todayStats) {
    return "Aucune utilisation aujourd'hui";
  }

  return `📊 **Rapport quotidien ${today}:**
• Requêtes: ${todayStats.requests}
• Succès: ${todayStats.successes}
• Échecs: ${todayStats.failures}
• Tokens: ${todayStats.tokens}
• Taux succès: ${
    todayStats.requests > 0
      ? Math.round((todayStats.successes / todayStats.requests) * 100)
      : 0
  }%`;
};
