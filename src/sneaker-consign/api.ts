import * as R from "remeda";
import { z } from "zod";
import { GET } from "../fetcher";
import { SNEAKER_CONSIGN_URLS } from "./utils";
import { URLValidator } from "../lib/validators";
import { SoldModel } from "../mongoose/models/sold.model";
import { adminAccount } from "./admin-account";
import { isValid } from "date-fns";
import { ProductModel } from "../mongoose/models/product.model";

function getStoreId() {
  return adminAccount.tokenData.id;
}

const TopShoe = z
  .object({
    avg: z.number(), // average price
    id: z.string(), // sku
    image: URLValidator,
    name: z.string(),
    numberSold: z.number().int(),
  })
  .transform(({ id, ...rest }) => {
    return {
      sku: id,
      ...rest,
    };
  });

export async function getBestSellers() {
  const sp = new URLSearchParams({
    duration: "3",
    storeId: getStoreId(),
  });

  const topSellers = await GET(SNEAKER_CONSIGN_URLS.STORE_HOME, sp, true)
    .then((data) => z.object({ topShoes: TopShoe.array() }).parse(data))
    .then((parsed) => parsed.topShoes);

  const uniqueSkus = R.uniqBy(topSellers, (s) => s.sku + s.name);

  const products = await ProductModel.find({
    $or: uniqueSkus.map(({ sku, name }) => ({ sku, name })),
  });

  const solds = await SoldModel.find({
    product: { $in: products.map((p) => p._id) },
  })
    .lean()
    .then((soldItems) =>
      soldItems.map(
        ({ price, product, daysListed, proceeds, size, dateSold }) => ({
          price,
          size,
          product,
          daysListed,
          proceeds,
          dateSold,
        }),
      ),
    );

  const productToSolds = R.groupBy(solds, (s) => s.product.toString());

  const out = topSellers.map((topSeller) => {
    /**
     * This can happen if our database copy of the sold data is missing
     * some new sales because we sync every x minutes in the main loop,
     * that's okay.. this isn't too critical
     */
    const product = products.find(
      (p) => p.sku === topSeller.sku && p.name === topSeller.name,
    );

    if (!product) {
      return topSeller;
    }

    const soldForThisSku = productToSolds[product._id.toString()];

    if (!soldForThisSku) {
      return topSeller;
    }

    const uniqueSizes = R.pipe(
      soldForThisSku,
      R.map((s) => s.size),
      R.sort((a, b) => a.localeCompare(b)),
    );

    const daysTilSoldData = {
      max: (R.maxBy(soldForThisSku, (s) => s.daysListed) ?? soldForThisSku[0])
        .daysListed,
      min: (R.minBy(soldForThisSku, (s) => s.daysListed) ?? soldForThisSku[0])
        .daysListed,
      avg: R.meanBy(soldForThisSku, (s) => s.daysListed),
    };

    const timeline = {
      latest: (
        R.maxBy(soldForThisSku, (s) => s.dateSold.getTime()) ??
        soldForThisSku[0]
      ).dateSold,
      earliest: (
        R.minBy(soldForThisSku, (s) => s.dateSold.getTime()) ??
        soldForThisSku[0]
      ).dateSold,
    };

    return {
      ...topSeller,
      items: R.sort(
        soldForThisSku,
        (a, b) => a.dateSold.getTime() - b.dateSold.getTime(), // ascending
      ),
      uniqueSizes,
      daysTilSoldData,
      timeline,
    };
  });

  return out;
}

export type BestSeller = Awaited<ReturnType<typeof getBestSellers>>[number];

export async function getItemActualSoldTime(listingId: string) {
  const sp = new URLSearchParams({
    listingId,
    storeId: getStoreId(),
  });

  const listingData = await GET(SNEAKER_CONSIGN_URLS.LISTING, sp, true);

  const { logItems } = z
    .object({
      listing: z.object({
        status: z.literal("Fulfilled"),
      }),
      logItems: z.array(
        z.object({
          message: z.string(),
          time: z.string(),
          type: z.number().int(),
        }),
      ),
    })
    .refine(
      (v) => {
        return v.logItems.every((logItem) => {
          try {
            const date = new Date(logItem.time);
            return isValid(date);
          } catch {
            return false;
          }
        });
      },
      {
        message: "One of the log items have invalid date",
      },
    )
    .parse(listingData);

  const soldEvent = logItems.find(({ message }) =>
    message.toLowerCase().includes("sold"),
  );

  if (!soldEvent) {
    throw new Error(
      "No sold event found" + JSON.stringify(logItems, undefined, 2),
    );
  }

  const date = new Date(soldEvent.time);

  return date; // sold date
}
