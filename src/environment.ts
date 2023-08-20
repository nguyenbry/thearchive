import { z } from "zod";

const environmentSchema = z.object({
  MONGO_URI: z.string(),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string(),
  WH_URL: z.string().url(),
  DEV_WH_URL: z.string().url(),
  DISCORD_BOT_TOKEN: z.string(),
  STOCKX_ALGOLIA_URL: z.string().url(),
  STOCKX_ALGOLIA_APP_ID: z.string(),
  STOCKX_ALGOLIA_API_KEY: z.string(),
  STOCKX_SEARCH_URL: z.string().url(),
  WH_TARGET: z.enum(["dev", "prod"]),
});

type environmentSchema = z.infer<typeof environmentSchema>;

const environmentRaw: {
  [TKey in keyof environmentSchema]: string | undefined;
} = {
  MONGO_URI: process.env.MONGO_URI,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  WH_URL: process.env.WH_URL,
  DEV_WH_URL: process.env.DEV_WH_URL,
  DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
  STOCKX_ALGOLIA_URL: process.env.STOCKX_ALGOLIA_URL,
  STOCKX_ALGOLIA_APP_ID: process.env.STOCKX_ALGOLIA_APP_ID,
  STOCKX_ALGOLIA_API_KEY: process.env.STOCKX_ALGOLIA_API_KEY,
  STOCKX_SEARCH_URL: process.env.STOCKX_SEARCH_URL,
  WH_TARGET: process.env.WH_TARGET,
};

const parsed = environmentSchema.safeParse(environmentRaw);

if (!parsed.success) throw new Error(JSON.stringify(parsed.error.flatten()));

export const environment = parsed.data;
