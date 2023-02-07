import snoowrap from "snoowrap";
import axios from "axios";

export const getReddit = async () => {
  const config = {
    username: process.env.username,
    password: process.env.password,
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
  };
  const r = new snoowrap({
    userAgent: "Whatever",
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    username: config.username,
    password: config.password,
  });

  const HungryArtists = await axios.get(
    "https://www.reddit.com/r/HungryArtists/search/.json?q=flair%3A%22Hiring%22&sort=new&restrict_sr=on&limit=5"
  );

  const artcommissions = await axios.get(
    "https://www.reddit.com/r/artcommissions/search/.json?q=flair%3A%22%5BPatron%5D%22&sort=new&restrict_sr=on&limit=5"
  );

  const starvingArtists = await axios.get(
    "https://www.reddit.com/r/starvingartists/search.json?q=Request&restrict_sr=1&sr_nsfw=&include_over_18=1&sort=top&t=day"
  );

  const merged = [
    ...HungryArtists.data.data.children,
    ...artcommissions.data.data.children,
    ...starvingArtists.data.data.children,
  ];

  return merged.map((submission) => ({
    title: submission.data.title,
    url: `https://www.reddit.com/${submission.data.permalink}`,
  }));
};
