/* eslint-disable unicorn/numeric-separators-style */
/* eslint-disable unicorn/number-literal-case */

import { WebhookClient, EmbedBuilder, type APIEmbedField } from "discord.js";
import { type SoldWithProductPopulated } from "../../../mongoose/models/sold.model";
import * as R from "remeda";
import { environment } from "../../../environment";
import { proceedsToPayout } from "../../../sneaker-consign/utils";
import { getFullStockXUrl } from "../../../stockx/utils";
import { Markdown } from "../../utils";

// export const client = new WebhookClient({ url: environment.WH_URL });
export const createWebhook = (url: keyof typeof environment) =>
  new WebhookClient({ url: environment[url] });

export const webhookClient = createWebhook(
  environment.WH_TARGET === "dev" ? "DEV_WH_URL" : "WH_URL",
);

export async function sendSoldEmbeds(solds: SoldWithProductPopulated[]) {
  const singleEmbed = (sold: SoldWithProductPopulated) => {
    const embed = new EmbedBuilder();
    embed.setColor("#4ade80");
    embed.setAuthor({
      name: "The Archive Sales",
    });
    embed.setTitle(`✅ SOLD - ${sold.product.name} - ${sold.size}`);

    const match = sold.product.algoliaMatch;

    embed.setThumbnail(sold.product.image);

    const fields: APIEmbedField[] = [
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
        value: sold.product.sku,
      },
      {
        name: "Days Until Sold",
        value: sold.daysListed.toLocaleString(),
      },
    ];

    if (match) {
      const stockFullLink = getFullStockXUrl(match.path);
      embed.setURL(stockFullLink);
      fields.push({
        name: "StockX",
        value: Markdown.link("Click", stockFullLink),
      });
    } else embed.setURL(sold.product.image);

    embed.addFields(fields);

    embed.setTimestamp(sold.dateSold);
    return embed;
  };

  const chunkedSendPromises = R.pipe(
    solds,
    R.map((s) => singleEmbed(s)),
    R.chunk(10),
    R.map((chunk) => webhookClient.send({ embeds: chunk })),
  );

  await Promise.all(chunkedSendPromises);
}

export const developmentClient = new WebhookClient({
  url: environment.DEV_WH_URL,
});

export function sendDevelopmentEmbed(title: string, description: string) {
  const embed = new EmbedBuilder();

  embed.setColor("#4ade80");
  embed.setDescription(description);
  embed.setTitle(title);

  void developmentClient.send({ embeds: [] });
}
