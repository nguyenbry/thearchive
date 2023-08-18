export class Logger {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static log(...message: any[]) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, unicorn/no-console-spaces
    console.log(`[${new Date().toLocaleString()}] `, ...message);
  }
}
