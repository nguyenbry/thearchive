export class Logger {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // this:void
  public static log(this: void, ...message: any[]) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    console.log(`[${new Date().toLocaleString()}]`, ...message);
  }
}

export type LogFunction = typeof Logger.log;

export const getPrefixedLogger = (
  prefix: string,
  loggerFunction?: LogFunction,
) => {
  const logFunction: LogFunction = (...message) => {
    const log = loggerFunction ?? Logger.log;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    log(`[${prefix}]`, ...message);
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
