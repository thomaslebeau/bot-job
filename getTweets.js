import { TwitterApi } from "twitter-api-v2";

import { getToken } from "./tokenService.js";

export const getTweets = async (research) => {
  const token = await getToken();
  const client = new TwitterApi(token);

  const jsTweets = await client.v2.search({
    query: research,
    expansions: ["entities.mentions.username", "author_id"],
  });

  if (jsTweets._realData.meta.result_count > 0) {
    return jsTweets._realData.data;
  }
  return [
    {
      text: "no result on twitter during the last seven days",
    },
  ];
};
