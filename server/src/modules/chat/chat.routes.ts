// See docs/ownership.md and src/ports/service-ports.ts; no endpoint is implemented here yet.
import { Router } from "express";
import type { Services } from "../../bootstrap/services.js";
import { chatController } from "./chat.controller.js";
export function chatRoutes(services: Services) {
  const router = Router();
  router.post("/chat", chatController(services));
  return router;
}
