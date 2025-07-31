# 🎨 Art Jobs Bot - Guide d'Installation Complet

## 📋 Fonctionnalités

- ✅ **Surveillance Reddit** automatique (toutes les 2h)
- ✅ **Filtrage intelligent** basé sur vos spécialités (creature design, semi-réaliste)
- ✅ **Google Sheets** intégré pour le suivi des opportunités
- ✅ **Emails matinaux** avec rapport quotidien (8h)
- ✅ **Alertes urgentes** par email pour opportunités chaudes
- ✅ **Templates de réponses** automatiques
- ✅ **Analyse concurrence** et timing

## 🚀 Installation

### 1. Prérequis

```bash
# Node.js 16+ requis
npm install

# Nouvelles dépendances ajoutées
npm install googleapis nodemailer
```

### 2. Configuration Discord Bot

1. Allez sur [Discord Developer Portal](https://discord.com/developers/applications)
2. Créez une nouvelle application
3. Section "Bot" → Copiez le **TOKEN**
4. Invitez le bot avec permissions : Manage Channels, Send Messages, Embed Links

### 3. Configuration Reddit API

1. Allez sur [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps)
2. "Create App" → Type: "script"
3. Notez le **Client ID** et **Client Secret**

### 4. Configuration Google Sheets

#### A. Créer un Service Account

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet
3. API & Services → Bibliothèque → Activez "Google Sheets API"
4. Identifiants → Créer des identifiants → Compte de service
5. Téléchargez le fichier JSON des clés

#### B. Créer le Google Sheet

1. Créez un nouveau Google Sheets
2. Copiez l'ID depuis l'URL : `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`
3. Partagez avec l'email du service account (lecture/écriture)

### 5. Configuration Email (Gmail)

#### A. Activer l'authentification 2 facteurs

1. Paramètres Google → Sécurité → Validation en 2 étapes

#### B. Créer un mot de passe d'application

1. Paramètres Google → Sécurité → Mots de passe des applications
2. Sélectionnez "Mail" et générez le mot de passe
3. Utilisez ce mot de passe dans `EMAIL_APP_PASSWORD`

### 6. Configuration .env

Créez le fichier `.env` avec vos vraies valeurs :

```bash
# Discord
DTOKEN=MTIzNDU2Nzg5MDEyMzQ1Njc4OQ.GhYtRa.exemple_token_discord

# Reddit
username=votre_username_reddit
password=votre_password_reddit
clientId=AbCdEfGhIj1234
clientSecret=aBcDeFgHiJkLmNoPqRsTuVwXyZ-1234567890

# Google Sheets
GOOGLE_PROJECT_ID=art-jobs-bot-123456
GOOGLE_PRIVATE_KEY_ID=abcdef1234567890abcdef1234567890abcdef12
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nVOTRE_CLE_PRIVEE_ICI\n-----END PRIVATE KEY-----\n"
GOOGLE_CLIENT_EMAIL=art-jobs-bot@art-jobs-bot-123456.iam.gserviceaccount.com
GOOGLE_CLIENT_ID=123456789012345678901
GOOGLE_SPREADSHEET_ID=1AbCdEfGhIjKlMnOpQrStUvWxYz1234567890AbCdEf

# Email
EMAIL_USER=votre.email@gmail.com
EMAIL_APP_PASSWORD=abcd efgh ijkl mnop
EMAIL_RECIPIENT=votre.email.personnel@gmail.com
```

## ▶️ Démarrage

```bash
# Développement
npm run dev

# Production
npm start
```

## 🧪 Tests

Une fois démarré, testez dans Discord :

```
!!ping                 # Test connexion
!!status              # Statut complet
!!test-sheets         # Test Google Sheets
!!test-email          # Test email
!!stats               # Statistiques du Sheet
!!force-search        # Recherche forcée
```

## 📊 Structure Google Sheets

Le bot créera automatiquement ces colonnes :

| Colonne            | Description                                   |
| ------------------ | --------------------------------------------- |
| Date Trouvé        | Quand l'opportunité a été détectée            |
| Titre              | Titre du post Reddit                          |
| Subreddit          | r/HungryArtists, etc.                         |
| URL                | Lien direct vers le post                      |
| Budget             | Budget extrait automatiquement                |
| Score Pertinence   | Score calculé (0-25+)                         |
| Heures Écoulées    | Âge du post                                   |
| Nb Commentaires    | Nombre de réponses                            |
| Niveau Concurrence | AUCUNE/FAIBLE/MODÉRÉE/FORTE                   |
| Statut             | NOUVEAU/TRAITÉ/IGNORÉ                         |
| Date Réponse       | Quand vous avez répondu                       |
| Réponse Envoyée    | Votre réponse                                 |
| Suivi Client       | Notes de suivi                                |
| Notes              | Notes personnelles                            |
| Priorité           | CREATURE DESIGN/HAUTE/MOYENNE/BASSE           |
| Catégorie          | Creature Design/Character Design/D&D/Game Art |

## 📧 Rapport Matinal

Chaque matin à 8h, vous recevrez un email HTML avec :

- 📊 **Statistiques globales** (total, nouvelles, prioritaires)
- 🎯 **Répartition par catégorie**
- ⚡ **Opportunités prioritaires** à traiter
- 🔗 **Lien direct** vers votre Google Sheets

## 🚨 Alertes Urgentes

Vous recevrez un email d'alerte immédiate si :

- Score ≥ 15 (très pertinent)
- Post ≤ 3h (très récent)
- Commentaires ≤ 2 (peu de concurrence)

## 🔧 Personnalisation

### Modifier vos spécialités

Éditez `getReddit.js` → fonction `scoreJobRelevance()` :

```javascript
// VOS SPÉCIALITÉS PRIORITAIRES
const highPriorityKeywords = {
  votre_specialite: 20
  // ...
};
```

### Changer les horaires

Éditez `index.js` :

```javascript
// Surveillance Reddit - toutes les 2 heures
cron.schedule("0 */2 * * *", async () => {

// Rapport matinal - 8h
cron.schedule("0 8 * * *", async () => {
```

## 🌐 Hébergement

### Railway (Recommandé)

1. Push sur GitHub
2. Connectez Railway à votre repo
3. Ajoutez toutes les variables d'environnement
4. Déployez !

**Variables Railway à ajouter :**

- Toutes les variables du fichier `.env`
- Attention à `GOOGLE_PRIVATE_KEY` (garder les `\n`)

### Render (Alternative)

- Même processus que Railway
- Gratuit mais hibernation après 15min

## 🐛 Dépannage

### Bot hors ligne

- Vérifiez `DTOKEN`
- Vérifiez les intents Discord

### Pas d'emails

- Vérifiez `EMAIL_APP_PASSWORD` (16 caractères)
- Vérifiez l'authentification 2 facteurs Gmail

### Google Sheets erreur

- Vérifiez que le service account a accès au Sheet
- Vérifiez `GOOGLE_SPREADSHEET_ID`
- Vérifiez que l'API Sheets est activée

### Pas de résultats Reddit

- Vérifiez les identifiants Reddit
- Testez avec `!!force-search`

## 📈 Utilisation

1. **Matin** : Consultez l'email de rapport
2. **Urgent** : Répondez aux alertes immédiates
3. **Suivi** : Mettez à jour le Google Sheets
4. **Analyse** : Utilisez `!!stats` pour voir les tendances

## 🎯 Prochaines Étapes

- [ ] Réponse automatique Reddit (à implémenter)
- [ ] Webhooks Discord pour notifications
- [ ] Dashboard web pour statistiques
- [ ] Intégration calendrier pour timing optimal

---

**🤖 Bot développé pour maximiser vos opportunités en creature design et character art !**
