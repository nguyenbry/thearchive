import type { EmbedBuilder } from "discord.js";
import * as R from "remeda";

export function chunksOf10(embeds: EmbedBuilder[]) {
  return R.chunk(embeds, 10);
}

export function hyphenIfZero(n: number) {
  return n === 0 ? "-" : n.toString();
}
