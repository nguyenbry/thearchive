/* eslint-disable unicorn/prevent-abbreviations */
import express from "express";
import bodyParser from "body-parser";
import { _2faRouter } from "./routers/2fa";
import { Logger } from "../logger";

const app = express();
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.use("/2fa", _2faRouter);

export function startExpressServer(callback?: () => void) {
  const PORT = 4000;
  app.listen(PORT, () => {
    Logger.log("✅ Express listening on port", PORT);

    callback?.();
  });
}
