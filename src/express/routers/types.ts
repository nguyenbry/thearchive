import type { Router } from "express";
import { z } from "zod";

const BASE_URL = "/api";

export function createRouterAndPath(path: string, router: Router) {
  z.string().startsWith("/").trim().parse(path);
  return {
    router,
    path: `${BASE_URL}${path}`,
  };
}
