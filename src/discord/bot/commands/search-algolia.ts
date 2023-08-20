import { getAlgoliaHits } from "../../../stockx/algolia-search";
import { getSearchAlgoliaEmbedChunks } from "../../embed/search-algolia";
import type { ConditionalCommand } from "../command-delegator";
import { COMMAND_PREFIXES } from "./prefixes";

export const searchAlgoliaCommand: ConditionalCommand = {
  condition: (message) => {
    if (message.author.bot) return false;
    const { content } = message;
    const cleaned = content.trim();
    return cleaned.startsWith(COMMAND_PREFIXES.SEARCH);
  },
  cleanCommand: (message) => {
    const { content } = message;
    const cleaned = content.trim();
    return cleaned.slice(COMMAND_PREFIXES.SEARCH.length).trim();
  },
  loggerPrefix: "search-algolia",
  callback: async (message, log, query) => {
    if (query.length === 0) {
      await message.reply(
        "Please provide a search query. Example: `!s yeezy 350`",
      );
      return;
    }

    const hits = await getAlgoliaHits(query);
    if (hits.length === 0) {
      const response = `No results found for '${query}'`;
      log(response);
      await message.reply(response);
      return;
    }

    log(`got ${hits.length} results, sending first 10`);
    for (const chunk of getSearchAlgoliaEmbedChunks(hits.slice(0, 10))) {
      await message.reply({ embeds: chunk });
    }
    log("🥳 sent search results");
  },
};
