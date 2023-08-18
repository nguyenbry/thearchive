import { Client, Events, type Message } from "discord.js";
import { getBestSellers } from "../sneaker-consign/api";
import { getBestSellerEmbedChunks } from "./webhook";
import { environment } from "../environment";
import { Logger } from "../logger";

const client = new Client({
  intents: ["GuildMessages", "MessageContent", "Guilds"],
});

client.once(Events.ClientReady, (c) => {
  Logger.log(`✅ Discord bot logged in as ${c.user.tag}`);
});

async function handleCommand(message: Message) {
  if (message.author.bot) return;
  const { content } = message;
  const cleaned = content.trim();
  if (!cleaned.startsWith("!best")) return;

  Logger.log("getting best sellers data");
  const data = await getBestSellers();
  Logger.log("got best sellers data, sending now");
  for (const chunk of getBestSellerEmbedChunks(data)) {
    await message.channel.send({ embeds: chunk });
  }
  Logger.log("🥳 sent best sellers data");
}

client.on(Events.MessageCreate, async (message) => {
  await handleCommand(message);
});

export function initBestSellersBot() {
  void client.login(environment.DISCORD_BOT_TOKEN);
}
