import nodemailer from "nodemailer";
import { getSheetStats, getPriorityOpportunities } from "./googleSheets.js";

// Configuration du transporteur email
let transporter;

const initEmailService = () => {
  transporter = nodemailer.createTransport({
    service: "gmail", // ou autre service
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD, // Mot de passe d'application Gmail
    },
  });

  console.log("✅ Service email initialisé");
};

// Générer le rapport matinal HTML
const generateMorningReport = async () => {
  const stats = await getSheetStats();
  const priorityOps = await getPriorityOpportunities();

  if (!stats) {
    return "<p>❌ Erreur lors de la récupération des données</p>";
  }

  const categoriesHtml = Object.entries(stats.categories)
    .map(([cat, count]) => `<li><strong>${cat}:</strong> ${count}</li>`)
    .join("");

  const priorityOpsHtml =
    priorityOps.length > 0
      ? priorityOps
          .map(
            (op) => `
      <div style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px; background: ${
        op.priorite === "CREATURE DESIGN" ? "#fff3cd" : "#f8f9fa"
      };">
        <h4 style="margin: 0 0 10px 0; color: ${
          op.priorite === "CREATURE DESIGN" ? "#856404" : "#495057"
        };">
          ${op.priorite === "CREATURE DESIGN" ? "🐲" : "⭐"} ${op.titre}
        </h4>
        <p style="margin: 5px 0;"><strong>📍 Subreddit:</strong> r/${
          op.subreddit
        }</p>
        <p style="margin: 5px 0;"><strong>💰 Budget:</strong> ${op.budget}</p>
        <p style="margin: 5px 0;"><strong>📊 Score:</strong> ${
          op.score
        } | <strong>👥 Concurrence:</strong> ${op.concurrence}</p>
        <p style="margin: 5px 0;"><strong>🎨 Catégorie:</strong> ${
          op.categorie
        }</p>
        <a href="${
          op.url
        }" style="display: inline-block; background: #007bff; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; margin-top: 10px;">
          👀 Voir l'annonce
        </a>
      </div>
    `
          )
          .join("")
      : '<p style="color: #6c757d; font-style: italic;">Aucune opportunité prioritaire en attente</p>';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Rapport Quotidien Art Jobs</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
        <h1 style="margin: 0; font-size: 28px;">🎨 Rapport Quotidien Art Jobs</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">${new Date().toLocaleDateString(
          "fr-FR",
          {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }
        )}</p>
      </div>

      <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
        <h2 style="color: #495057; margin-top: 0;">📊 Statistiques Globales</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
          <div style="background: white; padding: 15px; border-radius: 5px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="margin: 0; color: #007bff; font-size: 24px;">${
              stats.total
            }</h3>
            <p style="margin: 5px 0 0 0; color: #6c757d;">Total Opportunités</p>
          </div>
          <div style="background: white; padding: 15px; border-radius: 5px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="margin: 0; color: #28a745; font-size: 24px;">${
              stats.nouveaux
            }</h3>
            <p style="margin: 5px 0 0 0; color: #6c757d;">Nouvelles</p>
          </div>
          <div style="background: white; padding: 15px; border-radius: 5px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="margin: 0; color: #ffc107; font-size: 24px;">${
              stats.priorites
            }</h3>
            <p style="margin: 5px 0 0 0; color: #6c757d;">Prioritaires</p>
          </div>
          <div style="background: white; padding: 15px; border-radius: 5px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="margin: 0; color: #dc3545; font-size: 24px;">${
              stats.sansReponse
            }</h3>
            <p style="margin: 5px 0 0 0; color: #6c757d;">Sans Réponse</p>
          </div>
        </div>
      </div>

      <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h2 style="color: #495057; margin-top: 0;">🎯 Répartition par Catégorie</h2>
        <ul style="list-style: none; padding: 0;">
          ${categoriesHtml}
        </ul>
      </div>

      <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h2 style="color: #495057; margin-top: 0;">⚡ Opportunités Prioritaires à Traiter</h2>
        ${priorityOpsHtml}
      </div>

      <div style="margin-top: 30px; text-align: center; color: #6c757d; font-size: 14px;">
        <p>📈 Généré automatiquement par Art Jobs Bot</p>
        <p>🔗 <a href="https://docs.google.com/spreadsheets/d/${
          process.env.GOOGLE_SPREADSHEET_ID
        }" style="color: #007bff;">Voir le Google Sheets complet</a></p>
      </div>
    </body>
    </html>
  `;
};

// Envoyer le rapport matinal
export const sendMorningReport = async () => {
  try {
    if (!transporter) {
      initEmailService();
    }

    const reportHtml = await generateMorningReport();
    const stats = await getSheetStats();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_RECIPIENT, // Votre email personnel
      subject: `🎨 Art Jobs - ${stats?.nouveaux || 0} nouvelles opportunités`,
      html: reportHtml,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Rapport matinal envoyé:", info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Erreur envoi email:", error);
    return false;
  }
};

// Envoyer une alerte pour opportunité urgente
export const sendUrgentAlert = async (opportunity) => {
  try {
    if (!transporter) {
      initEmailService();
    }

    const alertHtml = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <div style="background: #ff6b35; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h1 style="margin: 0;">🚨 ALERTE OPPORTUNITÉ URGENTE</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2>${opportunity.relevanceScore >= 18 ? "🐲" : "🔥"} ${
      opportunity.title
    }</h2>
          <p><strong>📍 Subreddit:</strong> r/${opportunity.subreddit}</p>
          <p><strong>⏰ Posté il y a:</strong> ${opportunity.hoursAgo}h</p>
          <p><strong>👥 Commentaires:</strong> ${opportunity.numComments}</p>
          <p><strong>📊 Score:</strong> ${opportunity.relevanceScore}</p>
          
          <a href="${
            opportunity.url
          }" style="display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 15px;">
            💨 RÉPONDRE MAINTENANT
          </a>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_RECIPIENT,
      subject: `🚨 URGENT: ${
        opportunity.relevanceScore >= 18
          ? "Creature Design"
          : "Opportunité prioritaire"
      } - ${opportunity.hoursAgo}h`,
      html: alertHtml,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Alerte urgente envoyée:", info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Erreur envoi alerte:", error);
    return false;
  }
};

export { initEmailService };
