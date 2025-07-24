import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Votre profil artistique - PERSONNALISEZ CES INFORMATIONS
const ARTIST_PROFILE = {
  name: process.env.ARTIST_NAME || "Votre Nom",
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
  experience: [
    "5+ years in creature design",
    "Specialized in D&D campaign artwork",
    "Board game illustrations",
    "TCG card art",
    "Indie game concept art",
    "Monster manual style illustrations",
    "Character sheet designs",
  ],
  portfolio: process.env.PORTFOLIO_URL || "https://votre-portfolio.com",

  // Projets récents - À PERSONNALISER selon vos vrais projets
  recentWork: [
    "Dragon and wyvern designs for indie RPG",
    "Complete monster manual for D&D homebrew campaign",
    "Character portraits and sheets for Pathfinder",
    "Creature concepts for fantasy board game",
    "Demon and angel designs for TCG cards",
    "Familiar and companion designs",
  ],

  // Spécialités techniques
  deliverables: [
    "Character/creature sheets with multiple views",
    "Detailed anatomy and reference guides",
    "Turnaround sheets (front, back, side views)",
    "Color variations and alternate designs",
    "High-resolution files for print and digital use",
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
  // Analyser le type de projet
  const projectType = analyzeProjectType(title, description);
  const urgencyLevel =
    relevanceScore >= 18
      ? "HAUTE PRIORITÉ"
      : relevanceScore >= 15
      ? "PRIORITÉ MOYENNE"
      : "PRIORITÉ STANDARD";

  return `Tu es un assistant expert pour ${
    ARTIST_PROFILE.name
  }, un artiste spécialisé en creature design et character design.

PROFIL ARTISTE:
Nom: ${ARTIST_PROFILE.name}
Spécialités: ${ARTIST_PROFILE.specialties.join(", ")}
Styles: ${ARTIST_PROFILE.styles.join(", ")}
Portfolio: ${ARTIST_PROFILE.portfolio}

EXPERTISE TECHNIQUE:
${ARTIST_PROFILE.deliverables.join(" • ")}

PROJETS RÉCENTS:
${ARTIST_PROFILE.recentWork.join(" • ")}

ANNONCE À ANALYSER:
Titre: "${title}"
Description: "${description}"
Subreddit: r/${subreddit}
Budget: ${budget}
Type détecté: ${projectType}
Priorité: ${urgencyLevel}

MISSION:
Génère une réponse personnalisée qui montre une compréhension précise du brief et met en valeur l'expertise pertinente.

STRUCTURE OBLIGATOIRE:
1. Accroche personnalisée (montrer que vous avez LU et COMPRIS le brief spécifique)
2. Expertise pertinente (mentionner 1-2 projets similaires concrets)
3. Approche technique (comment vous allez procéder)
4. Portfolio et contact
5. Appel à l'action naturel

RÈGLES:
- Maximum 200 mots
- Ton professionnel mais chaleureux
- Éviter les clichés ("perfect fit", "I'd be thrilled")
- Montrer de la personnalité
- Inclure une référence spécifique au projet demandé
- Terminer par une question ou proposition concrète

Génère UNIQUEMENT la réponse, sans explication.`;
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

// Fonction principale d'analyse
export const analyzeJobWithAI = async (jobData) => {
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

    const startTime = Date.now();

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
      model: "llama-3.1-70b-versatile", // Modèle le plus puissant gratuit
      max_tokens: 350,
      temperature: 0.8, // Créativité pour personnalisation
      top_p: 0.9,
    });

    const responseTime = Date.now() - startTime;
    const aiResponse = completion.choices[0].message.content.trim();

    console.log(
      `✅ [Groq] Réponse générée en ${responseTime}ms (${aiResponse.length} chars)`
    );

    // Analyser la qualité de la réponse
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
        model: "llama-3.1-70b-versatile",
        tokens: completion.usage?.total_tokens || 0,
        responseTime: responseTime,
        cost: 0, // Groq est gratuit
      },
    };
  } catch (error) {
    console.error("❌ [Groq] Erreur analyse:", error);

    // Messages d'erreur spécifiques
    let errorMessage = error.message;
    if (error.code === "invalid_api_key") {
      errorMessage = "Clé API Groq invalide - Vérifiez GROQ_API_KEY";
    } else if (error.code === "rate_limit_exceeded") {
      errorMessage =
        "Limite de taux Groq atteinte - Attendez quelques secondes";
    }

    // Fallback vers template classique
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
        qualityScore: 5, // Score neutre pour fallback
        suggestedPortfolioSection: "portfolio complet",
      },
      metadata: {
        provider: "Fallback Template",
        model: "Template",
        tokens: 0,
        responseTime: 0,
        cost: 0,
      },
    };
  }
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

  const responses = [
    `Hi! Your ${projectType.toLowerCase()} project looks really interesting. I specialize in ${specialty.toLowerCase()} with a semi-realistic, stylized approach that could work well for your vision.

I've worked on similar projects including D&D campaigns, board game illustrations, and indie game concept art. My approach focuses on detailed anatomy and creative interpretation while maintaining the functionality you need.

You can see examples of my work at ${ARTIST_PROFILE.portfolio}

I'm available to start and would love to discuss your specific requirements. What's your timeline looking like?

Best regards`,

    `Hello! I noticed your ${projectType.toLowerCase()} post and it caught my attention. ${specialty} is one of my main specialties, and I work in a semi-realistic style that balances detail with stylized appeal.

Recent projects include creature designs for RPGs, character sheets for D&D campaigns, and concept art for board games. I focus on creating designs that are both visually striking and functional for your needs.

Check out my portfolio: ${ARTIST_PROFILE.portfolio}

I'd be happy to discuss your vision and provide some initial concepts. Feel free to reach out if you'd like to chat more about the project!

Cheers`,
  ];

  // Choisir une réponse aléatoire pour varier
  return responses[Math.floor(Math.random() * responses.length)];
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

// Obtenir les statistiques d'usage
export const getGroqUsageStats = () => {
  // À implémenter pour tracker l'usage si nécessaire
  return {
    totalRequests: 0,
    totalTokens: 0,
    averageResponseTime: 0,
    successRate: 0,
    estimatedCost: 0, // Groq est gratuit
  };
};
