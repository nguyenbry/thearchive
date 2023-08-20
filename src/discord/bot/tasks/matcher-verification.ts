import { EmbedBuilder } from "discord.js";
import {
  type Product,
  ProductModel,
} from "../../../mongoose/models/product.model";
import { webhookClient } from "../webhook/webhook";
import { Markdown } from "../../utils";
import { secondsToMilliseconds } from "date-fns";
import { getFullStockXUrl } from "../../../stockx/utils";

export const VERIFICATION_EMBED_KEY = "VERIFICATION";

const EXPLAIN =
  "We use an automated process to match portal items to StockX items to pull pricing data, but there can be mistakes.\n\nDo these two products match?";

function getDescription(product: Product) {
  const match = product.algoliaMatch;
  if (!match)
    throw new Error("We shouldn't be trying to send a message for this");

  const portalSection = [
    Markdown.bold("Portal Item"),
    Markdown.quote(`Name: ${Markdown.bold(product.name)}`),
    Markdown.quote(`SKU: ${Markdown.bold(product.sku)}`),
  ].join("\n");

  const stockXSectionToken = [
    Markdown.bold("StockX Item"),
    Markdown.quote(`Name: ${Markdown.bold(match.name)}`),
    Markdown.quote(Markdown.link("click", getFullStockXUrl(match.path))),
  ];

  if (match.sku) {
    stockXSectionToken.push(Markdown.quote(`SKU: ${Markdown.bold(match.sku)}`));
  }

  const stockXSection = stockXSectionToken.join("\n");
  return [
    EXPLAIN,
    portalSection,
    stockXSection,
    "Included image (if any) is of the portal item",
  ].join("\n\n");
}

async function askForVerification() {
  const productNeedsVerification = await ProductModel.findOne({
    verified: false,
    algoliaMatch: { $ne: null },
  });

  if (!productNeedsVerification) return;
  const embed = new EmbedBuilder();
  embed.setThumbnail(productNeedsVerification.image);
  embed.setColor("#4ade80");
  embed.setAuthor({
    name: "The Archive",
  });
  embed.setTitle(`❓ Verification Needed`);

  embed.setDescription(getDescription(productNeedsVerification));

  embed.setFooter({ text: VERIFICATION_EMBED_KEY });

  void webhookClient.send({
    embeds: [embed],
  });
}

export async function loopVerification() {
  await askForVerification();

  setInterval(() => {
    void askForVerification();
  }, secondsToMilliseconds(15));
}
