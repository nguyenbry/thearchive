import mongoose from "mongoose";
import { environment } from "../environment";
import { mongooseLog } from "../logger";
mongoose.set("strictQuery", false);

type ConnectionPromise = Promise<typeof mongoose>;

/**
 * Why are we doing this weird stuff?
 *
 * I'm afraid that since we're using nodemon, the mongoose connection might
 * already exist, and we don't want to create a new one. So we're going to
 * pull it from the global namespace if it exists, and if it doesn't, we'll
 * create a new one.
 */

const globalForMongo = globalThis as unknown as {
  mongo_conn: Awaited<ConnectionPromise> | null;
  mongo_promise: ConnectionPromise | undefined;
};

export async function connectToDatabase(): ConnectionPromise {
  if (globalForMongo.mongo_conn) {
    return globalForMongo.mongo_conn;
  }

  // connection doesn't exist, create a new one
  if (!globalForMongo.mongo_promise) {
    mongooseLog("Creating new MongoDB connection");

    const newPromise = mongoose.connect(environment.MONGO_URI, {
      authSource: "admin",
    });

    globalForMongo.mongo_promise = newPromise;
    try {
      globalForMongo.mongo_conn = await globalForMongo.mongo_promise;
    } catch (error) {
      globalForMongo.mongo_promise = undefined;
      mongooseLog("Error connecting to DB", error);

      // eslint-disable-next-line unicorn/no-process-exit
      process.exit(1);
    }
    mongooseLog("✅ Connected to DB");

    return globalForMongo.mongo_conn;
  }

  try {
    globalForMongo.mongo_conn = await globalForMongo.mongo_promise;
  } catch (error) {
    globalForMongo.mongo_promise = undefined;
    mongooseLog("Error connecting to DB", error);

    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(1);
  }

  return globalForMongo.mongo_conn;
}
