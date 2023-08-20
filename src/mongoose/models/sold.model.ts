import mongoose from "mongoose";
import { z } from "zod";
import { MongoObjectIdValidator } from "../../lib/validators";
import { MODEL_NAMES } from "./model-names";
import type { Product } from "./product.model";

const consignerId = z
  .string()
  .nullable()
  .transform((v) => {
    // eslint-disable-next-line unicorn/no-null
    if (typeof v === "string" && v.trim() === "") return null; // store's item
    return v;
  });

export const Sold = z.object({
  product: MongoObjectIdValidator,
  associatedId: z.string(),
  consignerId,
  dateSold: z.date(),
  daysListed: z.number().int(),
  price: z.number(),
  proceeds: z.number(),
  size: z.string(),
});

export type Sold = z.infer<typeof Sold>;
export type SoldWithProductPopulated = Omit<Sold, "product"> & {
  product: Product;
};

const soldSchema = new mongoose.Schema<Sold>({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: MODEL_NAMES.PRODUCT,
  },
  associatedId: {
    type: String,
    required: true,
  },
  consignerId: {
    type: String,
  },
  dateSold: {
    type: Date,
    required: true,
  },
  daysListed: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  proceeds: {
    type: Number,
    required: true,
  },
  size: {
    type: String,
    required: true,
  },
});

soldSchema.index({ associatedId: 1 }, { unique: true });

export const SoldModel = mongoose.model(MODEL_NAMES.SOLD, soldSchema);

export async function insertManySoldItems(solds: Sold[]) {
  await SoldModel.insertMany(solds);
}

export async function getLatestSoldAssociatedId() {
  const latests = await SoldModel.find({}, { associatedId: 1 })
    .sort({ dateSold: "desc" })
    .limit(1);

  const first = latests[0];
  if (!first) return;
  return first.associatedId;
}
