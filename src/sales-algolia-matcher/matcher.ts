// Step 1: use the sold item's name and model to find the associated algolia id

import Fuse from "fuse.js";
import * as R from "remeda";
import { getAlgoliaHits } from "../stockx/algolia-search";
import { z } from "zod";
import type { Product } from "../mongoose/models/product.model";

export async function matchAlgoliaProductToSoldItem(
  soldItem: Pick<Product, "name" | "sku">,
) {
  const queryAndMatch = async (query: string) => {
    const hits = await getAlgoliaHits(query);

    if (hits.length === 0) return;

    const fuseBySku = new Fuse(hits, {
      includeScore: true,
      keys: ["sku"],
      threshold: 0.6,
    });

    const fuseByName = new Fuse(hits, {
      includeScore: true,
      keys: ["name"],
      threshold: 0.6,
    });

    const resultsBySku = fuseBySku.search(soldItem.sku);
    const resultsByName = fuseByName.search(soldItem.name);

    const bestMatch = R.pipe(
      [...resultsBySku, ...resultsByName],
      R.map((fuzzyResult) => {
        const { score, item } = fuzzyResult;
        return {
          score: z.number().parse(score),
          item,
        };
      }),
      R.minBy((v) => v.score),
    );
    return bestMatch;
  };

  // we can query by sku or model, but sku is more reliable for shoes
  // let's see what happens with clothes though
  const { sku, name } = soldItem;

  const skuMatch = await queryAndMatch(sku);
  const nameMatch = await queryAndMatch(name);

  if (!skuMatch && !nameMatch) return;

  if (skuMatch && nameMatch) {
    if (skuMatch.score < nameMatch.score) return skuMatch;
    return nameMatch;
  }

  const out = skuMatch ?? nameMatch;

  if (!out) throw new Error("conditions make it impossible");

  return out;
}

// Step 2: use the algolia id to find the product's details
