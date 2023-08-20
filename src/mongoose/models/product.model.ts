import mongoose from "mongoose";
import { z } from "zod";
import { MongoObjectIdValidator, URLValidator } from "../../lib/validators";
import { MODEL_NAMES } from "./model-names";

export const Product = z.object({
  _id: MongoObjectIdValidator,

  image: URLValidator,
  name: z.string(),
  sku: z.string(),
  algoliaMatch: z
    .object({
      image: URLValidator,
      score: z.number().min(0).max(1),
      name: z.string(),
      sku: z.string().nullable(),
      path: z.string(),
      id: z.string(),
    })
    .nullable(),
  verified: z.boolean(),
});

export type Product = z.infer<typeof Product>;

const algoliaMatchSchema = new mongoose.Schema<Product["algoliaMatch"]>(
  {
    image: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    sku: {
      type: String,
    },
    path: {
      type: String,
      required: true,
    },
    id: {
      type: String,
      required: true,
    },
  },
  {
    _id: false,
  },
);

const productSchema = new mongoose.Schema<Product>({
  image: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  sku: {
    type: String,
    required: true,
  },
  algoliaMatch: {
    type: algoliaMatchSchema,
  },
  verified: {
    type: Boolean,
    required: true,
  },
});

productSchema.index({ name: 1, sku: 1 }, { unique: true });

export const ProductModel = mongoose.model(MODEL_NAMES.PRODUCT, productSchema);
