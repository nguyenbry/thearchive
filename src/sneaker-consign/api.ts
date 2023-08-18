import * as R from "remeda";
import { z } from "zod";
import { GET } from "../fetcher";
import { SNEAKER_CONSIGN_URLS } from "./utils";
import { URLValidator } from "../lib/validators";
import { SoldModel } from "../mongoose/models/sold.model";
import { adminAccount } from "./admin-account";

const TopShoe = z.object({
  avg: z.number(), // average price
  id: z.string(), // sku
  image: URLValidator,
  name: z.string(),
  numberSold: z.number().int(),
});

export async function getBestSellers() {
  const sp = new URLSearchParams({
    duration: "3",
    storeId: adminAccount.tokenData.id,
  });

  const topSellers = await GET(SNEAKER_CONSIGN_URLS.STORE_HOME, sp, true)
    .then((data) => z.object({ topShoes: TopShoe.array() }).parse(data))
    .then(
      (parsed) => parsed.topShoes.map((item) => ({ ...item, sku: item.id })), // for consistency
    );

  const uniqueSkus = R.uniq(topSellers.map((s) => s.id));

  const solds = await SoldModel.find(
    { sku: { $in: uniqueSkus } },
    { price: 1, sku: 1, daysListed: 1, proceeds: 1, size: 1, dateSold: 1 },
  )
    .lean()
    .then((soldItems) =>
      soldItems.map(({ price, sku, daysListed, proceeds, size, dateSold }) => ({
        price,
        size,
        sku,
        daysListed,
        proceeds,
        dateSold,
      })),
    );

  const skuToSold = R.groupBy(solds, (s) => s.sku);

  const out = topSellers.map((topSeller) => {
    /**
     * This can happen if our database copy of the sold data is missing
     * some new sales because we sync every x minutes in the main loop,
     * that's okay.. this isn't too critical
     */
    const soldForThisSku = skuToSold[topSeller.sku];

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
      items: R.pipe(
        soldForThisSku,
        R.map(({ sku: _, ...rest }) => ({ ...rest })), // don't need sku
        R.sort((a, b) => a.dateSold.getTime() - b.dateSold.getTime()), // ascending
      ),
      uniqueSizes,
      daysTilSoldData,
      timeline,
    };
  });

  return out;
}

export type BestSeller = Awaited<ReturnType<typeof getBestSellers>>[number];
