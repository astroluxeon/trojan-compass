import type { Operation } from '../../bootstrap/http-types.js';
import type { ChatPort } from '../../ports/service-ports.js';
export function mountChat(operation: Operation, chat: ChatPort) {
  operation(
    'post',
    '/chat',
    'ChatResponse',
    async (s, q, p, r) => chat.respond(s, r.body),
    'ChatTextRequest'
  );
}
