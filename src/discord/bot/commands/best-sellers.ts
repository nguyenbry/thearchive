import { getBestSellers } from "../../../sneaker-consign/api";
import { getBestSellerEmbedChunks } from "../../embed/best-sellers";
import type { ConditionalCommand } from "../command-delegator";
import { COMMAND_PREFIXES } from "./prefixes";

export const bestSellersCommand: ConditionalCommand = {
  condition: (message) => {
    if (message.author.bot) return false;
    const { content } = message;
    const cleaned = content.trim();
    return cleaned.startsWith(COMMAND_PREFIXES.BEST);
  },
  loggerPrefix: "best-sellers",
  callback: async (message, log) => {
    log("getting best sellers data");
    const data = await getBestSellers();
    log("got best sellers data, sending now");
    for (const chunk of getBestSellerEmbedChunks(data)) {
      await message.channel.send({ embeds: chunk });
    }
    log("🥳 sent best sellers data");
  },
};
