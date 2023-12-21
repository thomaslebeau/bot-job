import snoowrap from "snoowrap";
import axios from "axios";
import fs from "fs/promises";

export const getReddit = async () => {
  try {
    const config = {
      username: process.env.username,
      password: process.env.password,
      clientId: process.env.clientId,
      clientSecret: process.env.clientSecret,
    };

    // console.log(config);
    const r = new snoowrap({
      userAgent: "Whatever",
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      username: config.username,
      password: config.password,
    });
    // Fetch posts from the specified URL
    const subreddit = "HungryArtists";
    const queryParams = {
      q: 'flair:"Hiring"',
      sort: "new",
      restrict_sr: "on",
      limit: 5,
    };

    r.getSubreddit(subreddit)
      .search(queryParams)
      .then((posts) => {
        // Do something with the fetched posts
        console.log(posts);
      })
      .catch((error) => {
        console.error(error);
      });
    // const HungryArtists = await axios.get(
    //   "https://www.reddit.com/r/HungryArtists/search/.json?q=flair%3A%22Hiring%22&sort=new&restrict_sr=on&limit=5",
    //   config
    // );

    // const artcommissions = await axios.get(
    //   "https://www.reddit.com/r/artcommissions/search/.json?q=flair%3A%22%5BPatron%5D%22&sort=new&restrict_sr=on&limit=5"
    // );

    // const starvingArtists = await axios.get(
    //   "https://www.reddit.com/r/starvingartists/search.json?q=Request&restrict_sr=1&sr_nsfw=&include_over_18=1&sort=top&t=day"
    // );

    // const hireAnArtist = await axios.get(
    //   "https://www.reddit.com/r/hireanartist/search/.json?q=flair%3A%22%5BHiring%5D-project%22&&sort=new&restrict_sr=on&limit=5"
    // );

    // const hireAnArtist2 = await axios.get(
    //   "https://www.reddit.com/r/hireanartist/search/.json?q=flair%3A%22%5BHiring%5D-one-off%22&&sort=new&restrict_sr=on&limit=5"
    // );

    // const merged = [
    //   ...HungryArtists.data.data.children,
    //   // ...artcommissions.data.data.children,
    //   // ...starvingArtists.data.data.children,
    //   // ...hireAnArtist.data.data.children,
    //   // ...hireAnArtist2.data.data.children,
    // ];

    // return merged.map((submission) => {
    //   return {
    //     title: submission.data.title,
    //     url: `https://www.reddit.com${submission.data.permalink}`,
    //   };
    // });
  } catch (error) {
    console.log(error);
    return "error";
  }

  // const redditsSaved = await fs.readFile("./reddits.json", {
  //   encoding: "utf8",
  // });

  // const redditsSavedParsed = JSON.parse(redditsSaved);

  // const resultFilter = (firstArray, secondArray) => {
  //   return firstArray.filter(
  //     (firstArrayItem) =>
  //       !secondArray.some(
  //         (secondArrayItem) => firstArrayItem.title === secondArrayItem.title
  //       )
  //   );
  // };

  // const myDifferences = resultFilter(redditsSavedParsed, result);

  // if (myDifferences.length > 0) {
  //   await fs.writeFile("./reddits.json", JSON.stringify(result));
  //   return myDifferences;
  // }
};
