/* eslint-disable unicorn/no-null */
import { z } from "zod";
import { environment } from "../environment";

const releaseDate = z.custom<`{number}-{number}-{number}`>((v) => {
  if (typeof v !== "string") return false;
  const nums = v.split("-");
  if (nums.length !== 3) return false;

  return nums.every((n) => /^\d+$/.test(n));
});

const AlgoliaHit = z
  .object({
    id: z.string(),
    uuid: z.string(),
    name: z.string(),
    thumbnail_url: z.string().url(),
    url: z.string(), // partial url
    release_date: releaseDate,
    style_id: z.string().transform((v) => {
      if (v.length === 0) {
        return null;
      }
      return v;
    }),
    price: z.number(), // retail price
    highest_bid: z.number().int(),
    lowest_ask: z.number().int(),
    last_sale: z.number().transform((v) => Math.round(v)),
    sales_last_72: z.number().int(),
    deadstock_sold: z.number().int(),
  })
  .refine((v) => {
    return v.id === v.uuid;
  })
  .transform(
    ({
      price,
      url,
      deadstock_sold,
      thumbnail_url,
      highest_bid,
      last_sale,
      release_date,
      lowest_ask,
      sales_last_72,
      style_id,
      uuid: _,
      id,
      ...rest
    }) => {
      return {
        ...rest,
        image: thumbnail_url,
        algoliaId: id,
        retailPrice: price,
        stockXPath: url,
        numSold: deadstock_sold,
        numSoldLast72: sales_last_72,
        highestBid: highest_bid,
        lastSoldPrice: last_sale,
        releaseDateString: release_date,
        lowestAsk: lowest_ask,
        sku: style_id,
      };
    },
  );

type AlgoliaHit = z.infer<typeof AlgoliaHit>;

const AlgoliaResponse = z.object({
  hits: AlgoliaHit.array(),
});

export async function searchAlgolia(query: string) {
  const response = await fetch(environment.STOCKX_ALGOLIA_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-algolia-api-key": environment.STOCKX_ALGOLIA_API_KEY,
      "x-algolia-application-id": environment.STOCKX_ALGOLIA_APP_ID,
    },
    body: JSON.stringify({ query: query, facets: "*", filters: "" }),
  });

  if (response.status !== 200) {
    let message;
    try {
      message = (await response.json()) as object;
    } catch {
      message = "Unknown error";
    }

    const errorMessage = JSON.stringify(message);
    throw new Error("Algolia search failed. Info: " + errorMessage);
  }

  const data = (await response.json()) as unknown;
  try {
    const parsed = AlgoliaResponse.parse(data);
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log(JSON.stringify(error.flatten(), undefined, 2));
    }
    throw error;
  }
}
