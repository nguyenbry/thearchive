import { z } from "zod";

const environmentSchema = z.object({
  MONGO_URI: z.string(),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string(),
  WH_URL: z.string().url(),
  DISCORD_BOT_TOKEN: z.string(),
});

type environmentSchema = z.infer<typeof environmentSchema>;

const environmentRaw: {
  [TKey in keyof environmentSchema]: string | undefined;
} = {
  MONGO_URI: process.env.MONGO_URI,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  WH_URL: process.env.WH_URL,
  DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
};

const parsed = environmentSchema.safeParse(environmentRaw);

if (!parsed.success) throw new Error(JSON.stringify(parsed.error.flatten()));

export const environment = parsed.data;
