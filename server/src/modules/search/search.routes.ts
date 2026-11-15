// See docs/ownership.md and src/ports/service-ports.ts; no endpoint is implemented here yet.
import { Router } from "express";
import type { Services } from "../../bootstrap/services.js";
import { searchController } from "./search.controller.js";
export function searchRoutes(services: Services) {
  const router = Router();
  router.get("/places", searchController(services));
  return router;
}
