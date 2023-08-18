/* eslint-disable unicorn/prefer-top-level-await */
import { minutesToMilliseconds } from "date-fns";
import { startExpressServer } from "./src/express/server";
import { searchForNewSalesAndUpload } from "./src/loop/handle-sales";
import { connectToDatabase } from "./src/mongoose/connect-to-database";
import { adminAccount } from "./src/sneaker-consign/admin-account";
import { initBestSellersBot } from "./src/discord/best-sellers.bot";
import { Logger } from "./src/logger";

const runAndScheduleAgain = async () => {
  // eslint-disable-next-line unicorn/consistent-function-scoping
  Logger.log("attempting loop");
  await searchForNewSalesAndUpload();

  const timeFromNowMs = minutesToMilliseconds(12);

  const whenItWillRun = new Date(Date.now() + timeFromNowMs).toLocaleString();
  setTimeout(() => void runAndScheduleAgain(), timeFromNowMs);

  Logger.log("finished loop. will run again @", whenItWillRun);
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

void main();
