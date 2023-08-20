import { z } from "zod";
import { environment } from "../environment";

const MarketSchema = z
  .object({
    bidAskData: z.object({
      highestBid: z.number().int().nullable(),
      numberOfBids: z.number().int(),
      lowestAsk: z.number().int().nullable(),
      numberOfAsks: z.number().int(),
    }),
    salesInformation: z.object({
      lastSale: z.number().int(),
      salesLast72Hours: z.number().int(),
    }),
  })
  .transform(
    ({ bidAskData, salesInformation: { lastSale, salesLast72Hours } }) => {
      return {
        ...bidAskData,
        lastSoldPrice: lastSale,
        numSoldLast72: salesLast72Hours,
      };
    },
  );

const StockXProductSchema = z.object({
  id: z.string(),
  urlKey: z.string(),
  model: z.string(),
  styleId: z.string(),

  market: MarketSchema,
  media: z
    .object({
      thumbUrl: z.string().url(),
      smallImageUrl: z.string().url(),
    })
    .transform(({ smallImageUrl, thumbUrl }) => {
      return {
        image: thumbUrl,
        smallImageUrl,
      };
    }),
  variants: z.array(
    z
      .object({
        id: z.string(),
        market: MarketSchema,
        traits: z.object({
          size: z.string(),
        }),
      })
      .transform(({ market, traits: { size }, ...rest }) => {
        return {
          ...rest,
          ...market,
          size,
        };
      }),
  ),
});

export type StockXProduct = z.infer<typeof StockXProductSchema>;

/**
 * Beyond what algolia returns, we want to get the pricing per product
 */
export async function stockXProductSearch(path: string) {
  const response = await fetch(environment.STOCKX_SEARCH_URL + `/${path}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Auth-Token": "TODO",
    },
  });

  const data = (await response.json()) as unknown;

  console.log(JSON.stringify(data, undefined, 2), typeof data, 1000);

  return StockXProductSchema.parse(data);
}
