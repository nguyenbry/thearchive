export class Logger {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static log(...message: any[]) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, unicorn/no-console-spaces
    console.log(`[${new Date().toLocaleString()}] `, ...message);
  }
}

const getPrefixedLogger = (prefix: string) => {
  const logFunction: typeof Logger.log = (...message) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    Logger.log(`[${prefix}]`, ...message);
  };

  return logFunction;
};

export const healthCheckLog = getPrefixedLogger("💊");
export const adminAccountLog = getPrefixedLogger("admin account");
export const discordLog = getPrefixedLogger("discord");
export const expressLog = getPrefixedLogger("express");
export const mongooseLog = getPrefixedLogger("mongoose");
export const algoliaLog = getPrefixedLogger("algolia");
export const stockxLog = getPrefixedLogger("stockx");
export const loopLog = getPrefixedLogger("loop");
export const webhookLog = getPrefixedLogger("webhook");
export const sneakerConsignLog = getPrefixedLogger("sneaker consign");
