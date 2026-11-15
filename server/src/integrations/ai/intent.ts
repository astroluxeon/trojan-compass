import type { ChatTextRequest, RouteMode } from "@trojan-compass/shared/api";
import type { RequestScope } from "../../ports/service-ports.js";
import { ajv } from "../../lib/contracts.js";
import { unavailable } from "../../lib/errors.js";

export type NavigationIntent = {
  kind:
    | "find_building"
    | "find_place"
    | "show_floor"
    | "route"
    | "clarify"
    | "unsupported";
  query: string | null;
  buildingHint: string | null;
  originQuery: string | null;
  requestedMode: RouteMode | null;
  requestedStepFree: boolean | null;
  reference: "none" | "selected_place" | "context_building";
  question: string | null;
};
const text = { type: ["string", "null"], maxLength: 200, minLength: 1 };
export const intentSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    kind: {
      enum: [
        "find_building",
        "find_place",
        "show_floor",
        "route",
        "clarify",
        "unsupported",
      ],
    },
    query: text,
    buildingHint: text,
    originQuery: text,
    requestedMode: { enum: ["fastest", "stairs", "elevator", null] },
    requestedStepFree: { type: ["boolean", "null"] },
    reference: { enum: ["none", "selected_place", "context_building"] },
    question: { type: ["string", "null"], maxLength: 300, minLength: 1 },
  },
  required: [
    "kind",
    "query",
    "buildingHint",
    "originQuery",
    "requestedMode",
    "requestedStepFree",
    "reference",
    "question",
  ],
};
const check = ajv.compile(intentSchema);
export function validateIntent(value: unknown): NavigationIntent {
  if (!check(value)) throw unavailable();
  const intent = value as NavigationIntent;
  if (
    ["find_building", "find_place", "show_floor", "route"].includes(
      intent.kind,
    ) &&
    !intent.query?.trim() &&
    intent.reference === "none"
  )
    throw unavailable();
  return intent;
}
export interface IntentAdapter {
  interpret(
    scope: RequestScope,
    request: ChatTextRequest,
    retrievedRecords?: readonly import("../../modules/catalog/demo-catalog.js").CatalogRecord[],
  ): Promise<NavigationIntent>;
}
