// Ajoutez ces sections à votre aiAnalyzer.js

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
      model: "llama-3.1-70b-versatile",
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
        model: "llama-3.1-70b-versatile",
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
