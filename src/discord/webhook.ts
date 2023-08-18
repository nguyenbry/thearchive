/* eslint-disable unicorn/numeric-separators-style */
/* eslint-disable unicorn/number-literal-case */

import { WebhookClient, EmbedBuilder } from "discord.js";
import { type Sold } from "../mongoose/models/sold.model";
import * as R from "remeda";
import { environment } from "../environment";
import { proceedsToPayout } from "../sneaker-consign/utils";

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
