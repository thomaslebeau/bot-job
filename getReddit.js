import snoowrap from "snoowrap";

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
          query: 'flair:"Hiring"',
          sort: "new",
          restrict_sr: "on",
          limit: 10,
        },
      },
      {
        name: "artcommissions",
        params: {
          query: 'flair:"[Patron]"',
          sort: "new",
          restrict_sr: "on",
          limit: 10,
        },
      },
      {
        name: "starvingartists",
        params: {
          query: "Request OR Hiring OR Commission",
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

        const jobs = posts.map((submission) => ({
          title: submission.title,
          url: `https://www.reddit.com${submission.permalink}`,
          subreddit: config.name,
          created: submission.created_utc,
          score: submission.score,
          author: submission.author.name,
        }));

        console.log(`✅ r/${config.name}: ${jobs.length} offres trouvées`);
        allJobs.push(...jobs);

        // Petite pause entre les requêtes pour respecter les limites API
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ Erreur sur r/${config.name}:`, error.message);
        // Continuer avec les autres subreddits même si un échoue
      }
    }

    // Trier par date de création (plus récent d'abord)
    const sortedJobs = allJobs.sort((a, b) => b.created - a.created);

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
