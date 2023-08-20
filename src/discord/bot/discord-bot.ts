import { Client, Events } from "discord.js";
import { environment } from "../../environment";
import { discordLog } from "../../logger";
import { addCommandsToClient } from "./command-delegator";
import { bestSellersCommand } from "./commands";
import { searchAlgoliaCommand } from "./commands/search-algolia";

function setupClient() {
  const client = new Client({
    intents: [
      "GuildMessages",
      "MessageContent",
      "Guilds",
      "GuildMessageReactions",
    ],
  });
  client.once(Events.ClientReady, (c) => {
    discordLog(`✅ Discord bot logged in as ${c.user.tag}`);
  });

  addCommandsToClient(client, [bestSellersCommand, searchAlgoliaCommand]);

  client.on(Events.MessageReactionAdd, (reaction, user) => {
    if (user.bot) return;

    console.log(reaction.emoji.name, reaction.message.author);
    if (reaction.emoji.name !== "👍") return;
  });

  return () => client.login(environment.DISCORD_BOT_TOKEN);
}

export const startBot = setupClient();
