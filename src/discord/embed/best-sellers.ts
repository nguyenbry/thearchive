import { type APIEmbedField, EmbedBuilder } from "discord.js";
import type { BestSeller } from "../../sneaker-consign/api";
import * as R from "remeda";
import { Markdown } from "../utils";
import { chunksOf10 } from "./utils";

export function getBestSellerEmbedChunks(bests: BestSeller[]) {
  const chunks = R.pipe(
    bests,
    R.map((best) => {
      const embed = new EmbedBuilder();
      embed.setColor("#fef08a");
      embed.setAuthor({
        name: "The Archive's Top Sellers ⭐️",
      });
      embed.setTitle(best.name);
      embed.setURL(best.image);
      embed.setImage(best.image);

      const fields: APIEmbedField[] = [
        {
          name: "# Sales",
          value: best.numberSold.toString(),
          inline: true,
        },
        {
          name: "Average Price",
          value: Math.round(best.avg).toString(),
          inline: true,
        },
      ];

      if ("daysTilSoldData" in best) {
        // has extra data
        const desc = best.items
          .map((item) => {
            const tokens = [
              item.size,
              Math.round(item.price).toString(),
              `${item.daysListed} days`,
              item.dateSold.toLocaleDateString(),
            ];
            return tokens.join(" | ");
          })
          .join("\n");

        embed.setDescription(Markdown.codeBlock(desc, "ts"));

        const getTilSoldFieldValue = () => {
          const rows: { label: string; value: string }[] = [
            {
              label: "Min",
              value: best.daysTilSoldData.min.toString(),
            },
            {
              label: "Max",
              value: best.daysTilSoldData.max.toString(),
            },
            {
              label: "Average",
              value: best.daysTilSoldData.avg.toFixed(1),
            },
          ];

          const tokenized = rows.map(
            ({ label, value }) => `${label}: ${Markdown.bold(value)}`,
          );

          return tokenized.join("\n");
        };

        fields.push(
          {
            name: "Sizes",
            value: best.uniqueSizes.join("\n"),
            inline: true,
          },
          {
            name: "Days Until Sold",
            value: getTilSoldFieldValue(),
            inline: true,
          },
          {
            name: "Timeline",
            value: `Earliest: ${Markdown.bold(
              best.timeline.earliest.toLocaleDateString(),
            )}\nLatest: ${Markdown.bold(
              best.timeline.latest.toLocaleDateString(),
            )}`,
            inline: true,
          },
        );
      }

      fields.push({
        name: "SKU",
        value: best.sku,
      });
      embed.setFields(fields);
      return embed;
    }),
    chunksOf10,
  );

  return chunks;
}
