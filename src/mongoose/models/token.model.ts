import mongoose from "mongoose";
import { z } from "zod";
import { MongoObjectIdValidator } from "../../lib/validators";
import { SessionModel } from "./session.model";

export const Token = z.object({
  _id: MongoObjectIdValidator,
  authorizationToken: z.string(),
  expiresAt: z.date(),
  id: z.string(),
});

export type Token = z.infer<typeof Token>;

const tokenSchema = new mongoose.Schema<Token>({
  id: {
    type: String,
    required: true,
  },
  authorizationToken: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});

export const TokenModel = mongoose.model("token", tokenSchema);

export async function updateTokenData(tokenData: Omit<Token, "_id">) {
  await TokenModel.deleteMany({});
  await SessionModel.deleteMany({}); // no longer needed

  const newToken = new TokenModel(tokenData);

  await newToken.save();

  return Token.parse(newToken.toObject());
}

export async function getTokenData() {
  const tokens = await TokenModel.find({});

  if (tokens.length > 1) throw new Error("we should only have 1 ever");

  const first = tokens.at(0);

  if (!first) return;

  if (first.expiresAt < new Date()) {
    await TokenModel.deleteMany({});
    return;
  }
  return Token.parse(first.toObject());
}
