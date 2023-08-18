import mongoose from "mongoose";
import { z } from "zod";
import { MongoObjectIdValidator } from "../../lib/validators";
import { addMinutes, minutesToMilliseconds } from "date-fns";

export const Session = z.object({
  _id: MongoObjectIdValidator,
  id: z.string(),
  expires: z.date(),
});

type Session = z.infer<typeof Session>;

const sessionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  expires: {
    type: Date,
    required: true,
  },
});

export const SessionModel = mongoose.model("session", sessionSchema);

export async function updateSession(id: string) {
  await SessionModel.deleteMany({});

  const newSession = new SessionModel({
    id,
    expires: new Date(Date.now() + minutesToMilliseconds(19)),
  });

  await newSession.save();

  return Session.parse(newSession.toObject());
}

export async function getSessionData() {
  const sessions = await SessionModel.find({});

  if (sessions.length > 1) throw new Error("we should only have 1 ever");

  const first = sessions.at(0);

  if (!first) return;

  const expired = addMinutes(first.expires, 2) < new Date();

  if (expired) {
    await SessionModel.deleteMany({});
    return;
  }

  return Session.parse(first.toObject());
}
