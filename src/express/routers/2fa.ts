/* eslint-disable @typescript-eslint/no-misused-promises */
import express from "express";
import { z } from "zod";
import { adminAccount } from "../../sneaker-consign/admin-account";

export const _2faRouter = express.Router();

_2faRouter.get("/", async (request, response) => {
  const { query } = request;

  const parsed = z.object({ code: z.string() }).safeParse(query);

  if (!parsed.success) {
    response.status(400).json({
      success: false,
      message: "Failed validation",
    });
    return;
  }

  const { code } = parsed.data;

  await adminAccount.twoFactorAuth(code);

  response.status(200).json({
    success: true,
  });
});
