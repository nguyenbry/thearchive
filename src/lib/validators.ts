import { z } from "zod";
import { Types } from "mongoose";

const ObjectId = Types.ObjectId;

// export const MongoObjectIdStringValidator = z
//   .string()
//   .min(24)
//   .refine(
//     (v) => {
//       try {
//         return new Types.ObjectId(v).toString() === v;
//       } catch {
//         return false;
//       }
//     },
//     (v) => ({ message: `The input ${v} is not a valid Mongo Object ID` }),
//   );

export const MongoObjectIdValidator = z.custom<Types.ObjectId>(
  (id) => {
    if (!id) {
      return false;
    }

    if (id instanceof ObjectId) {
      return ObjectId.isValid(id);
    }

    return false;
  },
  (v) => {
    const received = typeof v === "string" ? v : JSON.stringify(v);
    return {
      message: `Expected a Mongo Object ID, but received: ${received}`,
    };
  },
);

export const URLValidator = z
  .string()
  .url()
  .transform((url) => encodeURI(url));
