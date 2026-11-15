import { Router } from "express";
import type { Services } from "../../bootstrap/services.js";
import type { ChatPort, RequestScope } from "../../ports/service-ports.js";
import type { ChatTextRequest } from "@trojan-compass/shared/api";
import { postEndpoint } from "../../lib/http.js";
import { invalid } from "../../lib/errors.js";
import { checkScope } from "../../lib/scope.js";
import { DemoCatalog } from "./demo-catalog.js";

export function catalogRoutes(
  services: Services,
  catalog: DemoCatalog,
  chat: ChatPort,
) {
  const router = Router();
  router.get(
    ["/preview/catalog", "/preview/catalog/:recordId"],
    async (req, res) => {
      for (const [key, value] of Object.entries(req.query)) {
        if (
          !["q", "kind", "dataVersion"].includes(key) ||
          typeof value !== "string"
        )
          throw invalid("Unsupported catalog query parameter.", key);
      }
      const kind = req.query.kind;
      if (kind !== undefined && kind !== "class" && kind !== "event")
        throw invalid("kind must be class or event.", "kind");
      const scope: RequestScope = {
        ...res.locals.scope,
        dataVersion:
          (req.query.dataVersion as string) ?? services.currentVersion(),
      };
      res.locals.scope = scope;
      catalog.assertVersion(scope.dataVersion);
      await services.datasets.assertSnapshot(scope);
      const items = req.params.recordId
        ? [catalog.get(String(req.params.recordId))]
        : catalog.search((req.query.q as string) ?? "", kind);
      checkScope(scope);
      res.setHeader("Cache-Control", "no-store");
      res.json({
        requestId: scope.requestId,
        dataVersion: scope.dataVersion,
        catalogVersion: catalog.catalogVersion,
        demo: true,
        items,
        total: items.length,
      });
    },
  );
  router.post(
    "/preview/chat",
    postEndpoint<ChatTextRequest>(
      services,
      "ChatTextRequest",
      "ChatResponse",
      (scope, body) => {
        catalog.assertVersion(scope.dataVersion);
        return chat.respond(scope, body);
      },
    ),
  );
  return router;
}
