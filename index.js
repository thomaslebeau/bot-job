import dotenv from "dotenv";
import { Client, GatewayIntentBits, EmbedBuilder } from "discord.js";
import cron from "node-cron";
import { getTweets } from "./getTweets.js";
import { getReddit } from "./getReddit.js";

dotenv.config();

const research =
  "Looking for (artist OR artists OR illustrator OR illustrators) (from:cubicle7 OR from:paizo OR from:GreenRoninPub OR from:Chaosium_Inc OR from:DR_Storytellers OR from:CriticalRole OR from:GhostfireG OR from:Wizards_DnD OR from:MariusBota OR from:MonteCookGames OR from:helloMCDM OR from:HitPointPress OR from:manticgames OR from:PetersenGames OR from:EvilHatOfficial OR from:LegendaryGamesJ OR from:KoboldPress OR from:DarringtonPress)";

const blue_color = 0x0099ff;
const red_color = 0xff0000;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const twitterCard = (text) => {
  return new EmbedBuilder()
    .setColor(blue_color)
    .setDescription(text)
    .setTimestamp();
};

const redditCard = (title, url) => {
  return new EmbedBuilder()
    .setColor(red_color)
    .setDescription(title)
    .setURL(url)
    .setTimestamp();
};

const PREFIX = "!!";

cron.schedule("*/9 * * * *", async () => {
  console.log("ping");
});

client.on("ready", () => {
  console.log("I am ready!");
  const twitterChannel = client.channels.cache.get("1072196135608926360");
  const redditChannel = client.channels.cache.get("1071849767115690004");
  // every day at 7AM ?
  cron.schedule("0 7 * * *", async () => {
    const tweets = await getTweets(research);

    tweets.map(({ text }) => {
      twitterChannel.send({
        embeds: [twitterCard(text)],
      });
    });
  });

  //Every 2hours
  cron.schedule("0 */2 * * *", async () => {
    const reddits = await getReddit();

    reddits.map(({ title, url }) => {
      redditChannel.send({
        embeds: [redditCard(title, url)],
      });
    });
  });
});

client.on("messageCreate", async (message) => {
  const input = message.content.slice(PREFIX.length).trim().split(" ");
  const command = input.shift();

  switch (command) {
    case "ping":
      message.channel.send("Pong!");
      break;
    case "twitter":
      const tweets = await getTweets(research);

      tweets.map(({ text }) => {
        message.channel.send({
          embeds: [twitterCard(text)],
        });
      });

      break;
    case "reddit":
      message.channel.send("start searching reddit....");
      const reddits = await getReddit();

      reddits.map(({ title, url }) => {
        message.channel.send({
          embeds: [redditCard(title, url)],
        });
      });
      break;

    default:
      break;
  }
  if (message.content.startsWith(PREFIX)) {
  }
});

client.login(process.env.DTOKEN);
