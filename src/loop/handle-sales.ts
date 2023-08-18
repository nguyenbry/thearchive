import { z } from "zod";
import { GET } from "../fetcher";
import { SNEAKER_CONSIGN_URLS } from "../sneaker-consign/utils";
import {
  Sold,
  SoldModel,
  getLatestSoldDate,
} from "../mongoose/models/sold.model";
import { sendSoldEmbeds } from "../discord/webhook";
import { adminAccount } from "../sneaker-consign/admin-account";
import { Logger } from "../logger";

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

const itemFromAPISchema = Sold.extend({
  dateSold: z
    .custom<`{number}/{number}/{number}`>((v) => {
      if (typeof v !== "string") return false;
      const nums = v.split("/");
      if (nums.length !== 3) return false;

      return nums.every((n) => /^\d+$/.test(n));
    })
    .transform((v) => new Date(v)),
});

async function getPageOfSales(page = 1) {
  const token = adminAccount.tokenData;
  z.number().int().parse(page);

  const query_: SalesQuery = { ...defaults, userId: token.id, page };

  // Logger.log("query", query_);
  const sp = new URLSearchParams({ ...query_, page: page.toString() });
  // Logger.log("sp", sp.toString());

  const response = await GET(SNEAKER_CONSIGN_URLS.SOLD, sp, true);

  const out = z
    .object({
      item1: itemFromAPISchema.array(),
      item2: z.number().int(),
    })
    .parse(response);

  return {
    items: out.item1,
    total: out.item2,
  };
}

export async function getSalesOptionalCursor(cursorDateSold: Date | undefined) {
  const firstPage = await getPageOfSales();

  let items = [...firstPage.items];

  if (cursorDateSold !== undefined) {
    const itemsAfterCursor = firstPage.items.filter((item) => {
      /**
       * >= because There could be other items with the same dateSold, so we need to
       * include those as well. We filter out the ones that are already
       * in the db later
       */
      return item.dateSold >= cursorDateSold;
    });

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

    if (cursorDateSold === undefined) items.push(...pageOfSales.items);
    else {
      const itemsAfterCursor = pageOfSales.items.filter((item) => {
        /**
         * >= because There could be other items with the same dateSold, so we need to
         * include those as well. We filter out the ones that are already
         * in the db later
         */
        return item.dateSold >= cursorDateSold;
      });

      if (itemsAfterCursor.length === 0) break;
      else items.push(...itemsAfterCursor);
    }
    page++;
  }

  return items.reverse(); // oldest first, newest last (so that the newer notifications send first)
}

export async function searchForNewSalesAndUpload() {
  const cursorDateSold = await getLatestSoldDate();

  Logger.log("searching for new sales with cursor", cursorDateSold);
  /**
   * Search for items sold after the cursor date
   */
  let newItems = await getSalesOptionalCursor(cursorDateSold);

  if (cursorDateSold !== undefined) {
    const alreadyExistsSet = await SoldModel.find(
      {
        associatedId: { $in: newItems.map((item) => item.associatedId) },
      },
      {
        associatedId: 1,
      },
    )
      .lean()
      .then(
        (partialDocuments) =>
          new Set(partialDocuments.map((document) => document.associatedId)),
      );

    newItems = newItems.filter((item) => {
      const sameDateAsCursor =
        item.dateSold.getTime() === cursorDateSold.getTime();
      return !sameDateAsCursor || !alreadyExistsSet.has(item.associatedId);
    });
  }

  if (newItems.length === 0) {
    Logger.log("no new items found. exiting");
    return;
  }

  Logger.log(`got ${newItems.length} new items. inserting...`);
  const results = await SoldModel.insertMany(newItems);
  Logger.log("inserted results", results.length);
  Logger.log("sending embeds");
  await sendSoldEmbeds(newItems);
  Logger.log("sending complete ✅");

  Logger.log({
    newItems,
  });
}
