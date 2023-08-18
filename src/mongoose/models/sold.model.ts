import mongoose from "mongoose";
import { z } from "zod";
import { URLValidator } from "../../lib/validators";

const consignerId = z
  .string()
  .nullable()
  .transform((v) => {
    // eslint-disable-next-line unicorn/no-null
    if (typeof v === "string" && v.trim() === "") return null;
    return v;
  });

export const Sold = z.object({
  associatedId: z.string(),
  consignerId,
  dateSold: z.date(),
  daysListed: z.number().int(),
  image: URLValidator,
  model: z.string(),
  price: z.number(),
  proceeds: z.number(),
  size: z.string(),
  sku: z.string(),
});

export type Sold = z.infer<typeof Sold>;

const soldSchema = new mongoose.Schema<Sold>({
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
  image: {
    type: String,
    required: true,
  },
  model: {
    type: String,
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
  sku: {
    type: String,
    required: true,
  },
});

soldSchema.index({ associatedId: 1 }, { unique: true });

export const SoldModel = mongoose.model("sold", soldSchema);

export async function insertManySoldItems(solds: Sold[]) {
  await SoldModel.insertMany(solds);
}

export async function getLatestSoldDate() {
  const latests = await SoldModel.find({}).sort({ dateSold: "desc" }).limit(1);

  const first = latests[0];
  if (!first) return;
  return first.dateSold;
}
