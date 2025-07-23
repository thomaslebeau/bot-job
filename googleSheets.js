import { google } from "googleapis";
import fs from "fs/promises";

// Configuration Google Sheets
let SPREADSHEET_ID; // Déclaré ici pour être accessible partout
const RANGE = "Opportunities!A:P"; // Colonnes A à P

let sheets;

// Initialiser l'authentification Google
const initGoogleAuth = async () => {
  try {
    // Charger l'ID du spreadsheet depuis les variables d'environnement
    SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;

    // Vérifier que toutes les variables d'environnement sont présentes
    if (
      !process.env.GOOGLE_PROJECT_ID ||
      !process.env.GOOGLE_PRIVATE_KEY ||
      !process.env.GOOGLE_CLIENT_EMAIL ||
      !SPREADSHEET_ID
    ) {
      console.error("❌ Variables manquantes:");
      console.error(
        "GOOGLE_PROJECT_ID:",
        process.env.GOOGLE_PROJECT_ID ? "✅" : "❌"
      );
      console.error(
        "GOOGLE_PRIVATE_KEY:",
        process.env.GOOGLE_PRIVATE_KEY ? "✅" : "❌"
      );
      console.error(
        "GOOGLE_CLIENT_EMAIL:",
        process.env.GOOGLE_CLIENT_EMAIL ? "✅" : "❌"
      );
      console.error("GOOGLE_SPREADSHEET_ID:", SPREADSHEET_ID ? "✅" : "❌");
      throw new Error(
        "Variables d'environnement Google manquantes. Vérifiez: GOOGLE_PROJECT_ID, GOOGLE_PRIVATE_KEY, GOOGLE_CLIENT_EMAIL, GOOGLE_SPREADSHEET_ID"
      );
    }

    console.log("🔐 Préparation des credentials...");
    console.log("📧 Service Account:", process.env.GOOGLE_CLIENT_EMAIL);
    console.log("📊 Spreadsheet ID:", SPREADSHEET_ID);

    // Nettoyer et formater la clé privée
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;

    // Si la clé n'a pas les délimiteurs, les ajouter
    if (!privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
      privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----\n`;
    }

    // Remplacer les \n littéraux par de vrais retours à la ligne
    privateKey = privateKey.replace(/\\n/g, "\n");

    console.log("🔑 Clé privée formatée:", privateKey.length, "caractères");

    // Utiliser les credentials depuis les variables d'environnement
    const credentials = {
      type: "service_account",
      project_id: process.env.GOOGLE_PROJECT_ID,
      private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
      private_key: privateKey,
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    };

    console.log("🔧 Création de l'authentification Google...");

    const auth = new google.auth.GoogleAuth({
      credentials: credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    console.log("📋 Test de l'authentification...");

    // Tester l'authentification
    const authClient = await auth.getClient();
    console.log("✅ Client authentifié");

    sheets = google.sheets({ version: "v4", auth });

    // Test basique pour vérifier l'accès au spreadsheet
    console.log("🧪 Test d'accès au spreadsheet...");
    try {
      await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
      });
      console.log("✅ Accès au spreadsheet confirmé");
    } catch (accessError) {
      console.error("❌ Erreur d'accès au spreadsheet:", accessError.message);
      console.log(
        "💡 Vérifiez que vous avez partagé le Google Sheet avec:",
        process.env.GOOGLE_CLIENT_EMAIL
      );
      throw accessError;
    }

    console.log("✅ Google Sheets authentification réussie");
    return true;
  } catch (error) {
    console.error("❌ Erreur auth Google Sheets:", error.message);
    console.error("🔍 Détails de l'erreur:", error);

    // Messages d'aide spécifiques
    if (error.message.includes("Invalid key format")) {
      console.log(
        "💡 Problème de format de clé privée. Vérifiez que GOOGLE_PRIVATE_KEY contient bien les délimiteurs BEGIN/END"
      );
    }
    if (error.message.includes("No key")) {
      console.log("💡 Clé privée manquante ou malformée");
    }
    if (error.message.includes("permission")) {
      console.log(
        "💡 Problème de permissions. Avez-vous partagé le Google Sheet avec:",
        process.env.GOOGLE_CLIENT_EMAIL
      );
    }

    return false;
  }
};

// Créer les en-têtes du spreadsheet si nécessaire
const createHeaders = async () => {
  try {
    if (!SPREADSHEET_ID) {
      throw new Error(
        "GOOGLE_SPREADSHEET_ID manquant dans les variables d'environnement"
      );
    }

    // D'abord, vérifier si le sheet "Opportunities" existe
    console.log("🔍 Vérification des feuilles existantes...");
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    let opportunitiesSheet = spreadsheet.data.sheets.find(
      (sheet) => sheet.properties.title === "Opportunities"
    );

    // Si le sheet "Opportunities" n'existe pas, le créer
    if (!opportunitiesSheet) {
      console.log('📄 Création de la feuille "Opportunities"...');
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: "Opportunities",
                },
              },
            },
          ],
        },
      });
      console.log('✅ Feuille "Opportunities" créée');
    } else {
      console.log('✅ Feuille "Opportunities" existe déjà');
    }

    const headers = [
      "Date Trouvé",
      "Titre",
      "Subreddit",
      "URL",
      "Budget",
      "Score Pertinence",
      "Heures Écoulées",
      "Nb Commentaires",
      "Niveau Concurrence",
      "Statut",
      "Date Réponse",
      "Réponse Envoyée",
      "Suivi Client",
      "Notes",
      "Priorité",
      "Catégorie",
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: "Opportunities!A1:P1",
      valueInputOption: "RAW",
      resource: {
        values: [headers],
      },
    });

    console.log(
      '✅ Headers Google Sheets créés dans la feuille "Opportunities"'
    );
  } catch (error) {
    console.error("❌ Erreur création headers:", error);
    throw error; // Propager l'erreur pour debugging
  }
};

export const opportunityExists = async (url) => {
  try {
    if (!sheets) {
      const authSuccess = await initGoogleAuth();
      if (!authSuccess) return false;
    }

    await ensureOpportunitiesSheetExists();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Opportunities!D:D", // Colonne URL
    });

    const urls = response.data.values || [];

    // Vérifier si l'URL existe déjà
    const exists = urls.some((row) => row[0] === url);

    if (exists) {
      console.log(`📋 Opportunité déjà en sheet: ${url.substring(0, 50)}...`);
    }

    return exists;
  } catch (error) {
    console.error("❌ Erreur vérification doublon:", error);
    return false; // En cas d'erreur, on permet l'ajout
  }
};

// Ajouter une opportunité au spreadsheet
export const addOpportunityToSheet = async (opportunity) => {
  try {
    const alreadyExists = await opportunityExists(opportunity.url);
    if (alreadyExists) {
      console.log(
        `⏭️ Opportunité déjà présente, ignorée: ${opportunity.title.substring(
          0,
          50
        )}...`
      );
      return "duplicate"; // Retourner un statut spécial
    }
    if (!sheets) {
      const authSuccess = await initGoogleAuth();
      if (!authSuccess) return false;
    }

    if (!SPREADSHEET_ID) {
      console.error("❌ GOOGLE_SPREADSHEET_ID manquant");
      return false;
    }

    // Extraire le budget du titre + description
    const fullText = opportunity.title + " " + (opportunity.description || "");
    const budgetMatch = fullText.match(/\$(\d+(?:,\d+)?)/);
    const budget = budgetMatch ? `${budgetMatch[1]}` : "Non spécifié";

    // Déterminer le niveau de concurrence
    let concurrenceLevel = "";
    if (opportunity.numComments === 0) {
      concurrenceLevel = "AUCUNE";
    } else if (opportunity.numComments <= 3) {
      concurrenceLevel = "FAIBLE";
    } else if (opportunity.numComments <= 8) {
      concurrenceLevel = "MODÉRÉE";
    } else {
      concurrenceLevel = "FORTE";
    }

    // Déterminer la priorité
    let priorite = "";
    if (opportunity.relevanceScore >= 25) {
      priorite = "MATCH"; // Plus strict
    } else if (opportunity.relevanceScore >= 18) {
      priorite = "HAUTE";
    } else if (opportunity.relevanceScore >= 12) {
      priorite = "MOYENNE";
    } else {
      priorite = "BASSE";
    }

    // Déterminer la catégorie
    const title = opportunity.title.toLowerCase();
    let categorie = "Général";
    if (title.includes("creature") || title.includes("monster")) {
      categorie = "Creature Design";
    } else if (title.includes("character")) {
      categorie = "Character Design";
    } else if (title.includes("dnd") || title.includes("d&d")) {
      categorie = "D&D/RPG";
    } else if (title.includes("game") || title.includes("board")) {
      categorie = "Game Art";
    }

    const row = [
      new Date().toLocaleString("fr-FR"), // Date Trouvé
      opportunity.title, // Titre
      opportunity.subreddit, // Subreddit
      opportunity.url, // URL
      budget, // Budget
      opportunity.relevanceScore, // Score Pertinence
      opportunity.hoursAgo, // Heures Écoulées
      opportunity.numComments, // Nb Commentaires
      concurrenceLevel, // Niveau Concurrence
      "NOUVEAU", // Statut
      "", // Date Réponse
      "", // Réponse Envoyée
      "", // Suivi Client
      "", // Notes
      priorite, // Priorité
      categorie, // Catégorie
    ];

    // S'assurer que la feuille "Opportunities" existe
    await ensureOpportunitiesSheetExists();

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Opportunities!A:P",
      valueInputOption: "RAW",
      resource: {
        values: [row],
      },
    });

    console.log(
      `✅ Opportunité ajoutée au Google Sheets: ${opportunity.title.substring(
        0,
        50
      )}...`
    );
    return "added";
  } catch (error) {
    console.error("❌ Erreur ajout Google Sheets:", error);
    return false;
  }
};

export const getNewOpportunities = async (allJobs) => {
  try {
    console.log(`🔍 Filtrage de ${allJobs.length} jobs via Google Sheets...`);

    if (!allJobs || allJobs.length === 0) return [];

    const newOpportunities = [];

    for (const job of allJobs) {
      const exists = await opportunityExists(job.url);
      if (!exists) {
        newOpportunities.push(job);
      }
    }

    console.log(
      `📊 ${newOpportunities.length} nouvelles opportunités détectées`
    );
    return newOpportunities;
  } catch (error) {
    console.error("❌ Erreur filtrage nouvelles opportunités:", error);
    return allJobs; // En cas d'erreur, retourner tous les jobs
  }
};

// S'assurer que la feuille "Opportunities" existe
const ensureOpportunitiesSheetExists = async () => {
  try {
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    let opportunitiesSheet = spreadsheet.data.sheets.find(
      (sheet) => sheet.properties.title === "Opportunities"
    );

    if (!opportunitiesSheet) {
      console.log('📄 Création de la feuille "Opportunities"...');
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: "Opportunities",
                },
              },
            },
          ],
        },
      });
      console.log('✅ Feuille "Opportunities" créée');
    }
  } catch (error) {
    console.error('❌ Erreur vérification feuille "Opportunities":', error);
  }
};

// Obtenir les stats du spreadsheet pour le rapport matinal
export const getSheetStats = async () => {
  try {
    console.log("📊 Début getSheetStats...");

    if (!sheets) {
      console.log("🔧 Initialisation auth Google...");
      const authSuccess = await initGoogleAuth();
      if (!authSuccess) {
        console.error("❌ Échec authentification Google");
        return null;
      }
    }

    if (!SPREADSHEET_ID) {
      console.error("❌ SPREADSHEET_ID manquant dans getSheetStats");
      return null;
    }

    // S'assurer que la feuille existe avant de lire
    console.log("🔍 Vérification feuille Opportunities...");
    await ensureOpportunitiesSheetExists();

    console.log("📖 Lecture des données...");
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Opportunities!A:P",
    });

    const rows = response.data.values || [];
    console.log(`📋 ${rows.length} lignes lues (incluant en-tête)`);

    if (rows.length <= 1) {
      console.log("📝 Aucune donnée trouvée, retour stats vides");
      return {
        total: 0,
        nouveaux: 0,
        priorites: 0,
        sansReponse: 0,
        categories: {},
      };
    }

    // Ignorer la ligne d'en-tête
    const dataRows = rows.slice(1);
    console.log(`📊 ${dataRows.length} lignes de données à analyser`);

    const stats = {
      total: dataRows.length,
      nouveaux: dataRows.filter((row) => row[9] === "NOUVEAU").length,
      priorites: dataRows.filter(
        (row) => row[14] === "HAUTE" || row[14] === "CREATURE DESIGN"
      ).length,
      sansReponse: dataRows.filter((row) => !row[11] || row[11] === "").length,
      categories: {},
    };

    // Compter par catégorie
    dataRows.forEach((row, index) => {
      try {
        const categorie = row[15] || "Général";
        stats.categories[categorie] = (stats.categories[categorie] || 0) + 1;
      } catch (err) {
        console.warn(`⚠️ Erreur traitement ligne ${index + 2}:`, err.message);
      }
    });

    console.log("✅ Stats calculées:", stats);
    return stats;
  } catch (error) {
    console.error("❌ Erreur lecture Google Sheets:", error);
    console.error("🔍 Détails:", {
      message: error.message,
      code: error.code,
      status: error.status,
    });

    // Messages d'aide spécifiques
    if (error.message.includes("Unable to parse range")) {
      console.log(
        '💡 La feuille "Opportunities" n\'existe probablement pas encore'
      );
    } else if (error.message.includes("permission")) {
      console.log("💡 Problème de permissions sur le Google Sheet");
    } else if (error.message.includes("not found")) {
      console.log("💡 Google Sheet introuvable avec cet ID");
    }

    return null;
  }
};

// Obtenir les opportunités prioritaires pour le mail matinal
export const getPriorityOpportunities = async () => {
  try {
    if (!sheets) {
      const authSuccess = await initGoogleAuth();
      if (!authSuccess) return [];
    }

    // S'assurer que la feuille existe
    await ensureOpportunitiesSheetExists();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Opportunities!A:P",
    });

    const rows = response.data.values || [];
    if (rows.length <= 1) return [];

    const dataRows = rows.slice(1);

    // Filtrer les opportunités prioritaires non traitées
    const priorityOps = dataRows
      .filter((row) => {
        const priorite = row[14];
        const statut = row[9];
        const reponse = row[11];

        return (
          (priorite === "HAUTE" || priorite === "CREATURE DESIGN") &&
          statut === "NOUVEAU" &&
          (!reponse || reponse === "")
        );
      })
      .slice(0, 10) // Limiter à 10 pour le mail
      .map((row) => ({
        titre: row[1],
        subreddit: row[2],
        url: row[3],
        budget: row[4],
        score: row[5],
        concurrence: row[8],
        priorite: row[14],
        categorie: row[15],
      }));

    return priorityOps;
  } catch (error) {
    console.error("❌ Erreur lecture opportunités prioritaires:", error);
    return [];
  }
};

// Marquer une opportunité comme traitée
export const markOpportunityAsProcessed = async (url, statut = "TRAITÉ") => {
  try {
    if (!sheets) {
      const authSuccess = await initGoogleAuth();
      if (!authSuccess) return false;
    }

    // S'assurer que la feuille existe
    await ensureOpportunitiesSheetExists();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Opportunities!A:P",
    });

    const rows = response.data.values || [];

    // Trouver la ligne correspondante
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][3] === url) {
        // Colonne URL
        const range = `Opportunities!J${i + 1}`; // Colonne Statut
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: range,
          valueInputOption: "RAW",
          resource: {
            values: [[statut]],
          },
        });

        console.log(`✅ Opportunité marquée comme ${statut}`);
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("❌ Erreur mise à jour statut:", error);
    return false;
  }
};

// Initialiser le spreadsheet
export const initSpreadsheet = async () => {
  try {
    console.log("🔧 Initialisation Google Sheets...");

    // Debug détaillé des variables d'environnement
    console.log("📋 Debug des variables d'environnement:");
    console.log(
      "GOOGLE_SPREADSHEET_ID:",
      process.env.GOOGLE_SPREADSHEET_ID
        ? "DÉFINI (" + process.env.GOOGLE_SPREADSHEET_ID.length + " chars)"
        : "❌ MANQUANT"
    );
    console.log(
      "GOOGLE_CLIENT_EMAIL:",
      process.env.GOOGLE_CLIENT_EMAIL
        ? "DÉFINI (" + process.env.GOOGLE_CLIENT_EMAIL.substring(0, 20) + "...)"
        : "❌ MANQUANT"
    );
    console.log(
      "GOOGLE_PROJECT_ID:",
      process.env.GOOGLE_PROJECT_ID
        ? "DÉFINI (" + process.env.GOOGLE_PROJECT_ID + ")"
        : "❌ MANQUANT"
    );
    console.log(
      "GOOGLE_PRIVATE_KEY:",
      process.env.GOOGLE_PRIVATE_KEY
        ? "DÉFINI (" + process.env.GOOGLE_PRIVATE_KEY.length + " chars)"
        : "❌ MANQUANT"
    );
    console.log(
      "GOOGLE_PRIVATE_KEY_ID:",
      process.env.GOOGLE_PRIVATE_KEY_ID ? "DÉFINI" : "❌ MANQUANT"
    );
    console.log(
      "GOOGLE_CLIENT_ID:",
      process.env.GOOGLE_CLIENT_ID ? "DÉFINI" : "❌ MANQUANT"
    );

    // Test simple de chargement
    const testId = process.env.GOOGLE_SPREADSHEET_ID;
    console.log(
      "🧪 Test de chargement SPREADSHEET_ID:",
      testId ? "OK" : "FAIL"
    );

    const authSuccess = await initGoogleAuth();
    if (authSuccess) {
      await createHeaders();
      console.log("🎉 Google Sheets initialisé avec succès!");
    }
    return authSuccess;
  } catch (error) {
    console.error("❌ Erreur initSpreadsheet:", error.message);

    // Debug supplémentaire
    console.log("🔍 Debug supplémentaire:");
    console.log(
      "process.env keys containing GOOGLE:",
      Object.keys(process.env).filter((key) => key.includes("GOOGLE"))
    );

    return false;
  }
};
