import mongoose from "mongoose";
import { z } from "zod";
import { collectionNames } from "../collection-names";
import { MongoObjectIdValidator } from "../../lib/validators";

export enum UserRole {
  User,
  Admin,
  Root,
}

// idk you might need this later
// const userRoleNumbers = z
//   .number()
//   .int()
//   .min(0)
//   .array()
//   .parse(Object.values(UserRole).filter((v) => typeof v === "number"));

const userValidator = z.object({
  _id: MongoObjectIdValidator,
  first: z.string(),
  last: z.string(),
  email: z.string().email(),
  // dont care about email because we are using SAML
  role: z.nativeEnum(UserRole),
  deleted: z.boolean(),
  units: z.string().array(),
  created_at: z.date(),
  updated_at: z.date(),
});

export type User = z.infer<typeof userValidator>;

const userSchema = new mongoose.Schema<User>(
  {
    first: { type: String, required: true },
    last: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: Number, required: true },
    units: {
      type: [String],
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

export const userModel = mongoose.model<User>(
  collectionNames.users,
  userSchema,
);
