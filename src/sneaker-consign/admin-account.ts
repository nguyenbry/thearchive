/* eslint-disable unicorn/prefer-event-target */
import { z } from "zod";
import { GET, POST } from "../fetcher";
import { SNEAKER_CONSIGN_URLS } from "./utils";
import {
  Token,
  getTokenData,
  updateTokenData,
} from "../mongoose/models/token.model";
import {
  getSessionData,
  updateSession,
} from "../mongoose/models/session.model";
import { addHours } from "date-fns";
import { environment } from "../environment";
import { EventEmitter } from "node:events";
import { Logger } from "../logger";
const DEFAULT_STORE_ID = "0";

type EmitterEvents = "ready";

class AdminAccount {
  /**
   * Only one of two can be defined below
   */
  private sessionId: string | undefined;
  private _tokenData: Token | undefined;
  private emitter = new EventEmitter();

  public on(event: EmitterEvents, listener: () => void) {
    this.emitter.on(event, listener);
  }

  private emit(event: EmitterEvents) {
    if (event === "ready") {
      this.emitter.emit(event);
    }
  }

  private setReady() {
    Logger.log("admin account is ready");
    this.emit("ready");
  }

  public async init() {
    const tokenData = await getTokenData();

    if (tokenData) {
      this._tokenData = tokenData;
      this.setReady();
      return;
    }
    Logger.log("no token data");
    // there's no token, check for a sesssion (2fa email has sent)
    const sessionData = await getSessionData();

    if (sessionData) {
      Logger.log("session data exists");
      this.sessionId = sessionData.id;
      return;
    }
    Logger.log("no session data");

    // no session data
    const sessionId = await this.getSessionId();
    await updateSession(sessionId);
  }

  private async getSessionId() {
    const body = await POST(SNEAKER_CONSIGN_URLS.SIGN_IN, {
      username: environment.ADMIN_EMAIL,
      password: environment.ADMIN_PASSWORD,
      storeId: DEFAULT_STORE_ID,
    });

    let session;
    try {
      session = z
        .object({
          session: z.string(),
        })
        .parse(body).session;
    } catch (error) {
      Logger.log("getting session failed validation", body);

      throw error;
    }

    this.sessionId = session;
    Logger.log("got session id");
    return session;
  }

  public async twoFactorAuth(code: string) {
    if (!this.sessionId) {
      throw new Error("Session id not initialized");
    }

    const data = await GET(
      SNEAKER_CONSIGN_URLS.TWO_FACTOR_AUTH,
      new URLSearchParams({
        sessionId: this.sessionId,
        code,
        isStore: "true",
      }),
    );

    const parsed = z
      .object({
        user: Token.pick({
          authorizationToken: true,
          id: true,
        }),
      })
      .parse(data);

    const tokenData = await updateTokenData({
      ...parsed.user,
      expiresAt: addHours(new Date(), 12),
    });

    this._tokenData = tokenData;
    this.sessionId = undefined; // no longer needed
    this.setReady();
  }

  get status() {
    if (this.sessionId) {
      return "NEEDS_2FA";
    } else if (this._tokenData) {
      return "READY";
    }
    return "NEEDS_LOGIN";
  }

  get tokenData() {
    // const status = this.status;
    // if (status !== "READY") {
    //   return;
    // }
    const tokenData = this._tokenData;
    if (!tokenData) {
      throw new Error("token data is undefined");
    }
    return tokenData;
  }

  public hello() {
    Logger.log("hello");
  }
}

export const adminAccount = new AdminAccount();
