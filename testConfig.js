import dotenv from "dotenv";
import { google } from "googleapis";

// Charger les variables d'environnement
dotenv.config();

async function testGoogleSheets() {
  console.log("🧪 TEST GOOGLE SHEETS ISOLÉ\n");

  try {
    // 1. Vérifier les variables
    console.log("1️⃣ Vérification des variables...");
    const requiredVars = {
      GOOGLE_PROJECT_ID: process.env.GOOGLE_PROJECT_ID,
      GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY,
      GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL,
      GOOGLE_SPREADSHEET_ID: process.env.GOOGLE_SPREADSHEET_ID
    };

    for (const [key, value] of Object.entries(requiredVars)) {
      if (!value) {
        throw new Error(`❌ ${key} manquant`);
      }
      console.log(`✅ ${key}: DÉFINI`);
    }

    // 2. Formater la clé privée
    console.log("\n2️⃣ Formatage de la clé privée...");
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;

    console.log("🔍 Format initial:", privateKey.substring(0, 50) + "...");

    // Vérifier le format
    if (!privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
      console.log("⚠️ Ajout des délimiteurs BEGIN/END");
      privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----\n`;
    }

    // Remplacer les \n littéraux
    privateKey = privateKey.replace(/\\n/g, "\n");
    console.log("✅ Clé formatée:", privateKey.length, "caractères");

    // 3. Créer les credentials
    console.log("\n3️⃣ Création des credentials...");
    const credentials = {
      type: "service_account",
      project_id: process.env.GOOGLE_PROJECT_ID,
      private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
      private_key: privateKey,
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs"
    };

    // 4. Tester l'authentification
    console.log("\n4️⃣ Test de l'authentification...");
    const auth = new google.auth.GoogleAuth({
      credentials: credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"]
    });

    console.log("✅ Authentification réussie");

    // 5. Créer le client Sheets
    console.log("\n5️⃣ Création du client Sheets...");
    const sheets = google.sheets({ version: "v4", auth });
    console.log("✅ Client Sheets créé");

    // 6. Tester l'accès au spreadsheet
    console.log("\n6️⃣ Test d'accès au spreadsheet...");
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    let spreadsheet; // Déclarer la variable ici

    try {
      spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: spreadsheetId
      });

      console.log("✅ Spreadsheet accessible");
      console.log("📋 Titre:", spreadsheet.data.properties.title);
      console.log("📊 Nombre de sheets:", spreadsheet.data.sheets.length);

      // Lister les noms des sheets
      spreadsheet.data.sheets.forEach(sheet => {
        console.log(`   - ${sheet.properties.title}`);
      });
    } catch (accessError) {
      console.error("❌ Erreur d'accès au spreadsheet:", accessError.message);

      if (accessError.message.includes("not found")) {
        console.log("💡 Le spreadsheet n'existe pas ou l'ID est incorrect");
        console.log("🔗 Vérifiez l'URL: https://docs.google.com/spreadsheets/d/" + spreadsheetId);
      } else if (accessError.message.includes("permission")) {
        console.log("💡 Problème de permissions");
        console.log("📧 Avez-vous partagé le Google Sheet avec:", process.env.GOOGLE_CLIENT_EMAIL);
        console.log(
          '🔧 Dans Google Sheets → Partager → Ajouter cette adresse avec permissions "Éditeur"'
        );
      }
      throw accessError;
    }

    // 7. Test d'écriture
    console.log("\n7️⃣ Test d'écriture...");

    try {
      // Utiliser le premier sheet disponible
      const firstSheetName = spreadsheet.data.sheets[0].properties.title;
      console.log("📝 Test d'écriture sur le sheet:", firstSheetName);

      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: `${firstSheetName}!A1`,
        valueInputOption: "RAW",
        resource: {
          values: [["Test Bot - " + new Date().toLocaleString()]]
        }
      });

      console.log(`✅ Écriture réussie dans ${firstSheetName}!A1`);
    } catch (writeError) {
      console.error("❌ Erreur d'écriture:", writeError.message);
      throw writeError;
    }

    console.log("\n🎉 TOUS LES TESTS GOOGLE SHEETS ONT RÉUSSI !");
    console.log("🚀 Vous pouvez maintenant lancer le bot principal");
  } catch (error) {
    console.error("\n💥 ÉCHEC DU TEST:", error.message);
    console.error("🔍 Erreur complète:", error);

    console.log("\n🔧 SOLUTIONS POSSIBLES:");
    console.log("1. Vérifiez que toutes les variables sont dans votre .env");
    console.log("2. Téléchargez un nouveau fichier JSON des credentials Google");
    console.log("3. Partagez le Google Sheet avec votre service account email");
    console.log("4. Vérifiez que l'API Google Sheets est activée dans votre projet");

    process.exit(1);
  }
}

// Lancer le test
testGoogleSheets();
