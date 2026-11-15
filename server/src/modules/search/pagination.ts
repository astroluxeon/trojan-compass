import { createHash } from 'node:crypto';
import { invalid } from '../../middleware/failure.js';
export function page<T>(items: T[], limit: number, cursor: string | undefined, identity: unknown) {
  const key = createHash('sha256').update(JSON.stringify(identity)).digest('hex');
  let offset = 0;
  if (cursor) {
    try {
      const c = JSON.parse(Buffer.from(cursor, 'base64url').toString());
      if (c.key !== key || !Number.isSafeInteger(c.offset) || c.offset < 0)
        invalid('Cursor does not match this query and dataset.');
      offset = c.offset;
    } catch {
      invalid('Invalid pagination cursor.');
    }
  }
  return {
    items: items.slice(offset, offset + limit),
    nextCursor:
      offset + limit < items.length
        ? Buffer.from(JSON.stringify({ key, offset: offset + limit })).toString('base64url')
        : null,
  };
}
