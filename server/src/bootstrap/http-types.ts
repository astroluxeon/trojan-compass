import type { Request } from 'express';
import type { RequestScope } from '../ports/service-ports.js';
export type Handler = (
  scope: RequestScope,
  query: Record<string, any>,
  params: Record<string, string>,
  request: Request
) => Promise<object>;
export type Operation = (
  method: 'get' | 'post',
  path: string,
  responseSchema: string,
  handler: Handler,
  bodySchema?: string
) => void;
