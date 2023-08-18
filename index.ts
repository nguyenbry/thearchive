/* eslint-disable unicorn/prefer-top-level-await */
import { minutesToMilliseconds, secondsToMilliseconds } from "date-fns";
import { startExpressServer } from "./src/express/server";
import { searchForNewSalesAndUpload } from "./src/loop/handle-sales";
import { connectToDatabase } from "./src/mongoose/connect-to-database";
import { adminAccount } from "./src/sneaker-consign/admin-account";
import { startBot } from "./src/discord/bot/discord-bot";
import { healthCheckLog, loopLog } from "./src/logger";
import { getAlgoliaHits } from "./src/stockx/algolia-search";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";

const developmentPath = __dirname + "/dev";
if (!existsSync(developmentPath)) mkdirSync(developmentPath);

const runAndScheduleAgain = async () => {
  // eslint-disable-next-line unicorn/consistent-function-scoping
  loopLog("attempting loop");
  await searchForNewSalesAndUpload();

  const timeFromNowMs = minutesToMilliseconds(12);

  const whenItWillRun = new Date(Date.now() + timeFromNowMs);

  const secondsFromNowItWillRun = () =>
    Math.round((whenItWillRun.getTime() - Date.now()) / 1000);

  const healthCheck = () => {
    healthCheckLog(`loop running in ${secondsFromNowItWillRun()} seconds`);
  };

  const t = setInterval(healthCheck, secondsToMilliseconds(15));

  setTimeout(() => {
    clearInterval(t);
    void runAndScheduleAgain();
  }, timeFromNowMs);

  loopLog("finished loop. will run again @", whenItWillRun.toLocaleString());
};

async function main() {
  adminAccount.on("ready", () => {
    void runAndScheduleAgain(); // comment this out if you're editing the code and don't want it to run on startup
    void startBot(); // the bot uses the admin account, so only put it online after the admin account is ready
  });

  await connectToDatabase();
  void adminAccount.init();
  startExpressServer();
}

async function testMain() {
  const queries = [
    "BAPE Color Camo Shark Day Pack Backpack // Navy - M/L",
    // "yeezy 700",
    // "new balance 992",
    // "supreme swarovski tee",
  ];

  const proms = queries.map(async (query) => {
    const data = await getAlgoliaHits(query);
    return data;
  });

  const datas = await Promise.all(proms);

  writeFileSync(
    developmentPath + "/algolia.json",
    JSON.stringify(datas, undefined, 2),
    "utf8",
  );
}

void main();
// void testMain();
