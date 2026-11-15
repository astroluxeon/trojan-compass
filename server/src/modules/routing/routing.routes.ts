import type { Operation } from '../../bootstrap/http-types.js';
import type { RoutingPort } from '../../ports/service-ports.js';
export function mountRouting(operation: Operation, routing: RoutingPort) {
  operation(
    'post',
    '/routes',
    'RouteResponse',
    async (s, q, p, r) => ({
      clientRequestId: r.body.clientRequestId,
      route: await routing.calculateRoute(s, r.body),
    }),
    'RouteRequest'
  );
}
