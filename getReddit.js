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
    const subredditHA = "HungryArtists";
    const queryParamsHA = {
      query: 'flair:"Hiring"',
      sort: "new",
      restrict_sr: "on",
      limit: 5,
    };
    const subredditAC = "artcommissions";
    const queryParamsAC = {
      query: 'flair:"[Patron]"',
      sort: "new",
      restrict_sr: "on",
      limit: 5,
    };
    const subredditSA = "starvingartists";
    const queryParamsSA = {
      query: "Request",
      sort: "top",
      restrict_sr: "on",
      limit: 5,
    };
    const subredditHAA = "hireanartist";
    const queryParamsHAA = {
      query: 'flair:"[Hiring]-project"',
      sort: "new",
      restrict_sr: "on",
      limit: 5,
    };

    const subredditHAA2 = "hireanartist";
    const queryParamsHAA2 = {
      query: 'flair:"[Hiring]-one-off"',
      sort: "new",
      restrict_sr: "on",
      limit: 5,
    };

    const HungryArtists = await r
      .getSubreddit(subredditHA)
      .search(queryParamsHA)
      .then((posts) => {
        // Do something with the fetched posts
        const data = posts.map((submission) => {
          return {
            title: submission.title,
            url: `https://www.reddit.com${submission.permalink}`,
          };
        });
        return [...data];
      })
      .catch((error) => {
        console.error(error);
      });

    const artcommissions = await r
      .getSubreddit(subredditAC)
      .search(queryParamsAC)
      .then((posts) => {
        // Do something with the fetched posts
        const data = posts.map((submission) => {
          return {
            title: submission.title,
            url: `https://www.reddit.com${submission.permalink}`,
          };
        });
        return [...data];
      })
      .catch((error) => {
        console.error(error);
      });

    const starvingArtists = await r
      .getSubreddit(subredditSA)
      .search(queryParamsSA)
      .then((posts) => {
        // Do something with the fetched posts
        const data = posts.map((submission) => {
          return {
            title: submission.title,
            url: `https://www.reddit.com${submission.permalink}`,
          };
        });
        return [...data];
      })
      .catch((error) => {
        console.error(error);
      });

    const hireAnArtist = await r
      .getSubreddit(subredditHAA)
      .search(queryParamsHAA)
      .then((posts) => {
        // Do something with the fetched posts
        const data = posts.map((submission) => {
          return {
            title: submission.title,
            url: `https://www.reddit.com${submission.permalink}`,
          };
        });
        return [...data];
      })
      .catch((error) => {
        console.error(error);
      });

    const hireAnArtist2 = await r
      .getSubreddit(subredditHAA2)
      .search(queryParamsHAA2)
      .then((posts) => {
        // Do something with the fetched posts
        const data = posts.map((submission) => {
          return {
            title: submission.title,
            url: `https://www.reddit.com${submission.permalink}`,
          };
        });
        return [...data];
      })
      .catch((error) => {
        console.error(error);
      });

    const merged = [
      ...HungryArtists,
      ...artcommissions,
      ...starvingArtists,
      ...hireAnArtist,
      ...hireAnArtist2,
    ];

    return merged.map((submission) => {
      return {
        title: submission.title,
        url: submission.url,
      };
    });
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
