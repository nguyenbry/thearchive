/* eslint-disable unicorn/numeric-separators-style */
/* eslint-disable unicorn/number-literal-case */

import { WebhookClient, EmbedBuilder, type APIEmbedField } from "discord.js";
import { type Sold } from "../mongoose/models/sold.model";
import * as R from "remeda";
import { environment } from "../environment";
import { proceedsToPayout } from "../sneaker-consign/utils";
import type { BestSeller } from "../sneaker-consign/api";
import { Markdown } from "./utils";

export const client = new WebhookClient({ url: environment.WH_URL });

export async function sendSoldEmbeds(solds: Sold[]) {
  const singleEmbed = (sold: Sold) => {
    const embed = new EmbedBuilder();
    embed.setColor("#4ade80");
    embed.setAuthor({
      name: "The Archive",
    });
    embed.setTitle(`✅ SOLD - ${sold.model} - ${sold.size}`);
    embed.setURL(sold.image);
    embed.setThumbnail(sold.image);
    embed.addFields([
      {
        name: "Price",
        value: sold.price.toFixed(2),
      },
      {
        name: "Payout",
        value: proceedsToPayout(sold.proceeds).toFixed(2), // processing fee
      },
      {
        name: "Size",
        value: sold.size,
      },
      {
        name: "SKU",
        value: sold.sku,
      },
      {
        name: "Days Until Sold",
        value: sold.daysListed.toLocaleString(),
      },
      {
        name: "Date",
        value: sold.dateSold.toLocaleDateString(),
      },
    ]);
    return embed;
  };

  const chunkedSendPromises = R.pipe(
    solds,
    R.map((s) => singleEmbed(s)),
    R.chunk(10),
    R.map((chunk) => client.send({ embeds: chunk })),
  );

  await Promise.all(chunkedSendPromises);
}

export function getBestSellerEmbedChunks(bests: BestSeller[]) {
  return R.pipe(
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
    R.chunk(10),
  );
}
