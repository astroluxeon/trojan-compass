import type {
  APIError,
  BuildingListResponse,
  BuildingResponse,
  FloorResponse,
  SceneResponse,
  PlaceSearchResponse,
  RouteRequest,
  RouteResponse,
  ChatTextRequest,
  ChatResponse,
} from '@trojan-compass/shared';

export class APIRequestError extends Error {
  constructor(
    public status: number,
    public error: APIError['error']
  ) {
    super(error.message);
  }
}
export async function api<T>(
  path: string,
  options: { body?: unknown; signal?: AbortSignal } = {}
): Promise<T> {
  const timeout = AbortSignal.timeout(path === '/chat' ? 60_000 : 15_000);
  const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;
  const response = await fetch('/api' + path, {
    method: options.body === undefined ? 'GET' : 'POST',
    signal,
    headers: options.body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: 'no-store',
  });
  const value = await response.json();
  if (!response.ok)
    throw new APIRequestError(
      response.status,
      value?.error && typeof value.error === 'object'
        ? value.error
        : { code: 'HTTP_ERROR', message: 'The request could not be completed.', requestId: '' }
    );
  if (!value || typeof value !== 'object') throw new Error('Invalid API response.');
  return value as T;
}
export const versionQuery = (version: string) => `dataVersion=${encodeURIComponent(version)}`;
export const client = {
  buildings: (signal?: AbortSignal) =>
    api<BuildingListResponse>('/buildings?limit=100', { signal }),
  building: (id: string, version: string, signal?: AbortSignal) =>
    api<BuildingResponse>(`/buildings/${encodeURIComponent(id)}?${versionQuery(version)}`, {
      signal,
    }),
  scene: (id: string, version: string, signal?: AbortSignal) =>
    api<SceneResponse>(`/buildings/${encodeURIComponent(id)}/scene?${versionQuery(version)}`, {
      signal,
    }),
  floor: (id: string, floor: string, version: string, signal?: AbortSignal) =>
    api<FloorResponse>(
      `/buildings/${encodeURIComponent(id)}/floors/${encodeURIComponent(floor)}?${versionQuery(version)}`,
      { signal }
    ),
  search: (query: string, version: string, signal?: AbortSignal) =>
    api<PlaceSearchResponse>(
      `/places?q=${encodeURIComponent(query)}&limit=20&${versionQuery(version)}`,
      { signal }
    ),
  route: (body: RouteRequest, signal?: AbortSignal) =>
    api<RouteResponse>('/routes', { body, signal }),
  chat: (body: ChatTextRequest, signal?: AbortSignal) =>
    api<ChatResponse>('/chat', { body, signal }),
};
