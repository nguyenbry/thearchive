import type { AlgoliaHit } from "../../stockx/algolia-search";
import * as R from "remeda";
import { chunksOf10, hyphenIfZero } from "./utils";
import { type APIEmbedField, EmbedBuilder } from "discord.js";
import { getFullStockXUrl } from "../../stockx/utils";
import { Markdown } from "../utils";

export function getSearchAlgoliaEmbedChunks(hits: AlgoliaHit[]) {
  return R.pipe(
    hits,
    R.map((hit) => {
      const embed = new EmbedBuilder();
      embed.setColor("#a855f7");

      const fullStockXUrl = getFullStockXUrl(hit.stockXPath);
      embed.setAuthor({
        name: hit.name,
        url: fullStockXUrl,
      });
      embed.setThumbnail(hit.image);

      const fields: APIEmbedField[] = hit.sku
        ? [
            {
              name: "SKU",
              value: hit.sku,
              inline: true,
            },
          ]
        : [];

      fields.push(
        {
          name: "Retail",
          value: hit.retailPrice.toString(),
          inline: true,
        },
        {
          name: "Lowest Ask",
          value: hyphenIfZero(hit.lowestAsk),
          inline: true,
        },
        {
          name: "Highest Bid",
          value: hyphenIfZero(hit.highestBid),
          inline: true,
        },
        {
          name: "Total Sold",
          value: hyphenIfZero(hit.numSold),
          inline: true,
        },
        {
          name: "Sold Last 3 Days",
          value: hyphenIfZero(hit.numSoldLast72),
          inline: true,
        },
        {
          name: "Last Sold Price",
          value: "$" + hit.lastSoldPrice.toString(),
          inline: true,
        },
      );

      if (hit.releaseDateString) {
        fields.push({
          name: "Release Date",
          value: hit.releaseDateString,
          inline: true,
        });
      }

      fields.push({
        name: "StockX",
        value: Markdown.link("Click", fullStockXUrl),
        inline: true,
      });
      embed.addFields(fields);
      return embed;
    }),
    chunksOf10,
  );
}
