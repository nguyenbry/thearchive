import { z } from "zod";
import * as R from "remeda";
import { GET } from "../fetcher";
import { SNEAKER_CONSIGN_URLS } from "../sneaker-consign/utils";
import {
  Sold,
  SoldModel,
  type SoldWithProductPopulated,
  getLatestSoldAssociatedId,
} from "../mongoose/models/sold.model";
import { sendSoldEmbeds } from "../discord/bot/webhook/webhook";
import { adminAccount } from "../sneaker-consign/admin-account";
import { Logger, mongooseLog, sneakerConsignLog, webhookLog } from "../logger";
import { getItemActualSoldTime } from "../sneaker-consign/api";
import { matchAlgoliaProductToSoldItem } from "../sales-algolia-matcher/matcher";
import { Product, ProductModel } from "../mongoose/models/product.model";
import { URLValidator } from "../lib/validators";

const defaults = {
  location: "0",
  inventory: "0",
  search: "",
  storeId: "none",
  isStore: "true",
  sort: "-1", // descending time?
} as const;

type SalesQueryVariables = {
  userId: string;
  page?: number;
};
type SalesQueryDefaults = typeof defaults;

type SalesQuery = SalesQueryDefaults & SalesQueryVariables;

const ItemFromAPI = Sold.omit({
  product: true,
})
  .extend({
    dateSold: z.custom<`{number}/{number}/{number}`>((v) => {
      if (typeof v !== "string") return false;
      const nums = v.split("/");
      if (nums.length !== 3) return false;

      return nums.every((n) => /^\d+$/.test(n));
    }),
    model: z.string(),
    sku: z.string(),
    image: URLValidator,
  })
  .transform(({ model, ...rest }) => {
    return {
      name: model,
      ...rest,
    };
  });

type ItemFromAPI = z.infer<typeof ItemFromAPI>;

async function getPageOfSales(page = 1) {
  const token = adminAccount.tokenData;
  z.number().int().parse(page);

  const query_: SalesQuery = { ...defaults, userId: token.id, page };

  // Logger.log("query", query_);
  const sp = new URLSearchParams({ ...query_, page: page.toString() });
  // Logger.log("sp", sp.toString());

  const response = await GET(SNEAKER_CONSIGN_URLS.SOLD, sp, true);

  return z
    .object({
      item1: ItemFromAPI.array(),
      item2: z.number().int(),
    })
    .transform(({ item1, item2 }) => {
      return {
        items: item1,
        total: item2,
      };
    })
    .parse(response);
}

export async function getSalesOptionalCursor(
  cursorAssociatedId: string | undefined,
) {
  const firstPage = await getPageOfSales();

  let items = [...firstPage.items];

  if (cursorAssociatedId !== undefined) {
    /**
     * Get all the items before the cursoe. the page of items should be sorted
     * from newest to oldest already.
     */

    const itemsAfterCursor = R.takeWhile(
      firstPage.items,
      (item) => item.associatedId !== cursorAssociatedId, // stop when we find the cursor
    );

    if (itemsAfterCursor.length === 0) return []; // no new items

    if (itemsAfterCursor.length < firstPage.items.length) {
      // we have some new items, but not all (dont need to look back further)
      return itemsAfterCursor.reverse(); // oldest first, newest last (so that the newer notifications send first)
    }

    items = itemsAfterCursor;
  }

  const total = firstPage.total;

  let left = total - items.length;

  let page = 2;

  while (left > 0) {
    const pageOfSales = await getPageOfSales(page);
    left = total - items.length;

    if (cursorAssociatedId === undefined) items.push(...pageOfSales.items);
    else {
      const itemsAfterCursor = R.takeWhile(
        pageOfSales.items,
        (item) => item.associatedId !== cursorAssociatedId, // stop when we find the cursor
      );

      if (itemsAfterCursor.length === 0) break;
      else items.push(...itemsAfterCursor);
    }
    page++;
  }

  return items.reverse(); // oldest first, newest last (so that the newer notifications send first)
}

export async function searchForNewSalesAndUpload() {
  const latestSoldIdMaybe = await getLatestSoldAssociatedId();

  sneakerConsignLog("searching for new sales with cursor", latestSoldIdMaybe);

  /**
   * Search for items sold after the cursor item
   */
  const newItems: ItemFromAPI[] = await getSalesOptionalCursor(
    latestSoldIdMaybe,
  );

  if (newItems.length === 0) {
    sneakerConsignLog("no new items found. exiting");
    return;
  }

  const getProducts = async () => {
    const uniqueItems = R.uniqBy(newItems, (v) => v.name + v.sku);

    const existingProductsParsed = await ProductModel.find({
      $or: uniqueItems.map(({ name, sku }) => ({ name, sku })),
    })
      .lean()
      .then((products) => Product.array().parse(products));

    const needToCreate = uniqueItems.filter((item) => {
      const alreadyExists = existingProductsParsed.some(
        (product) => product.name === item.name && product.sku === item.sku,
      );
      return !alreadyExists;
    });

    const newProductsPayloads: Omit<Product, "_id">[] = [];

    const proms = needToCreate.map(async (item) => {
      const algoliaMatch = await matchAlgoliaProductToSoldItem(item);

      newProductsPayloads.push({
        image: item.image,
        name: item.name,
        sku: item.sku,
        algoliaMatch: algoliaMatch
          ? {
              image: algoliaMatch.item.image,
              score: algoliaMatch.score,
              name: algoliaMatch.item.name,
              sku: algoliaMatch.item.sku,
              path: algoliaMatch.item.stockXPath,
              id: algoliaMatch.item.algoliaId,
            }
          : null,
        verified: algoliaMatch ? algoliaMatch.score < 0.3 : false, // how confident are we of the match?
      });
    });

    await Promise.all(proms);

    const newProducts = await ProductModel.insertMany(newProductsPayloads);

    const newProductsParsed = Product.array().parse(newProducts);

    return [...existingProductsParsed, ...newProductsParsed];
  };

  const productsPromise = getProducts();

  const withActualDateSold = await Promise.all(
    newItems.map(async ({ dateSold: _, ...rest }) => {
      const id = rest.associatedId;

      const actualDateSold = await getItemActualSoldTime(id);

      return {
        ...rest, // keep everything but change the dateSold to a Date object
        dateSold: actualDateSold,
      };
    }),
  );

  const products = await productsPromise;

  const withProductPopulated = withActualDateSold.map((item) => {
    const product = products.find(
      (product) => product.name === item.name && product.sku === item.sku,
    );

    if (!product) throw new Error("product not found");

    const out: SoldWithProductPopulated = {
      ...item,
      product: product,
    };

    return out;
  });

  // writeFileSync("./matches.json", JSON.stringify(matches, undefined, 2));

  sneakerConsignLog(`got ${withActualDateSold.length} new items. inserting...`);
  const results = await SoldModel.insertMany(
    withProductPopulated.map(({ product, ...rest }) => ({
      ...rest,
      product: product._id,
    })),
  );
  mongooseLog("inserted results", results.length);
  webhookLog("sending embeds");
  await sendSoldEmbeds(withProductPopulated);
  webhookLog("sending complete ✅");

  Logger.log({
    newItems,
  });
}
