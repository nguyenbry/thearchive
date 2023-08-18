/* eslint-disable unicorn/prefer-top-level-await */
import { minutesToMilliseconds, secondsToMilliseconds } from "date-fns";
import { startExpressServer } from "./src/express/server";
import { searchForNewSalesAndUpload } from "./src/loop/handle-sales";
import { connectToDatabase } from "./src/mongoose/connect-to-database";
import { adminAccount } from "./src/sneaker-consign/admin-account";
import { initBestSellersBot } from "./src/discord/best-sellers.bot";
import { Logger, healthCheckLog, loopLog } from "./src/logger";
import { searchAlgolia } from "./src/stockx/algolia-search";
import { writeFileSync } from "node:fs";

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
    initBestSellersBot(); // the bot uses the admin account, so only put it online after the admin account is ready
  });

  await connectToDatabase();
  void adminAccount.init();
  startExpressServer();
}

async function testMain() {
  const queries = [
    "jordan 1 banned",
    "yeezy 700",
    "new balance 992",
    "supreme swarovski tee",
  ];

  const proms = queries.map(async (query) => {
    const data = await searchAlgolia(query);
    return data;
  });

  const datas = await Promise.all(proms);

  writeFileSync("./algolia.json", JSON.stringify(datas, undefined, 2), "utf8");
  // console.log(JSON.stringify(data, undefined, 2));
}

void main();
// void testMain();
