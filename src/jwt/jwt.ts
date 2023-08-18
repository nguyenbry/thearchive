import { SignJWT } from "jose";
import { UserRole } from "../mongoose/models/user.model";
import { v4 } from "uuid";
import { addDays } from "date-fns";

export async function createJWT(payload: {
  first: string;
  last: string;
  email: string;
  role: UserRole;
  units: string[];
  id: string;
}) {
  const expiresAt = addDays(Date.now(), 7);

  /**
   * We actually pass the role as a string not a number, so we need to convert
   */

  const actualPayload = { ...payload, role: UserRole[payload.role] };

  return await new SignJWT(actualPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setJti(v4())
    .setIssuedAt(Date.now())
    .setIssuer("DRA")
    .setExpirationTime(expiresAt.valueOf()) // 7 days
    .sign(new TextEncoder().encode("super-secret-TODO"));
}
