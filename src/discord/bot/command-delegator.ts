import { type Client, Events, type Message } from "discord.js";
import { discordLog, getPrefixedLogger, type LogFunction } from "../../logger";

export type ConditionalCommand = {
  condition: ((m: Message) => boolean) | boolean;
  callback: (
    m: Message,
    logger: LogFunction,
    contentCopy: string,
  ) => void | Promise<void>;
  loggerPrefix?: string;
  cleanCommand?: (m: Message) => string;
};

export function addCommandsToClient(
  client: Client,
  commands: ConditionalCommand[],
) {
  client.on(Events.MessageCreate, (message) => {
    for (const {
      condition,
      callback,
      cleanCommand,
      loggerPrefix,
    } of commands) {
      if (typeof condition === "function" ? condition(message) : condition) {
        const contentCopy = cleanCommand
          ? cleanCommand(message)
          : message.content;

        const logger =
          loggerPrefix === undefined
            ? discordLog
            : getPrefixedLogger(loggerPrefix, discordLog);
        void callback(message, logger, contentCopy);
      }
    }
  });
}
