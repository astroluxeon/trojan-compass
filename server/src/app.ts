import express, { type Request, type Response } from 'express';
import { createHash, randomUUID } from 'node:crypto';
import { mountBuildings } from './modules/buildings/buildings.routes.js';
import { mountScenes } from './modules/scenes/scenes.routes.js';
import { mountPlaces } from './modules/places/places.routes.js';
import { mountSearch } from './modules/search/search.routes.js';
import { mountRouting } from './modules/routing/routing.routes.js';
import { mountChat } from './modules/chat/chat.routes.js';
import type { Handler } from './bootstrap/http-types.js';
import type { RequestScope } from './ports/service-ports.js';
import { createServices } from './bootstrap/create-services.js';
import { contract, validate, validateParameter } from './infrastructure/contract.js';
import { Failure, invalid } from './middleware/failure.js';

import { errorHandler } from './middleware/error-handler.js';

export function createApp(options: Parameters<typeof createServices>[0] = {}) {
  const app = express();
  const services = createServices(options);
  const { datasets, search, routing, chat } = services;
  app.disable('x-powered-by');
  app.set('etag', false);
  app.use((request, response, next) => {
    const supplied = request.header('X-Request-ID');
    response.locals.requestId =
      supplied && /^[a-zA-Z0-9._:-]{1,100}$/.test(supplied) ? supplied : randomUUID();
    response.setHeader('X-Request-ID', response.locals.requestId);
    next();
  });
  app.use(express.json({ limit: '1mb', strict: true }));

  function operation(
    method: 'get' | 'post',
    path: string,
    schema: string,
    handler: Handler,
    bodySchema?: string
  ) {
    const spec = contract.paths[path][method];
    app[method](
      '/api' + path.replace(/\{([^}]+)\}/g, ':$1'),
      async (request: Request, response: Response) => {
        if (method === 'post') {
          response.setHeader('Cache-Control', 'no-store');
          if (path === '/chat' && request.is('multipart/form-data'))
            throw new Failure('IMAGE_INPUT_DISABLED', 501, 'Chat image input is disabled.');
          if (!request.is('application/json'))
            throw new Failure(
              'UNSUPPORTED_MEDIA_TYPE',
              415,
              'Send application/json. Image input is disabled.'
            );
          if (bodySchema) validate(bodySchema, request.body);
        }
        const query: Record<string, any> = {};
        const params: Record<string, string> = {};
        const allowed =
          spec.parameters?.filter((p: any) => p.in === 'query').map((p: any) => p.name) ?? [];
        if (Object.keys(request.query).some((k) => !allowed.includes(k)))
          invalid('Unknown query parameter.');
        for (const parameter of spec.parameters ?? []) {
          if (!['query', 'path'].includes(parameter.in)) continue;
          const raw =
            parameter.in === 'query'
              ? request.query[parameter.name]
              : request.params[parameter.name];
          if (raw === undefined) {
            if (parameter.required) invalid(`Missing ${parameter.name}.`);
            continue;
          }
          if (typeof raw !== 'string') invalid(`Invalid ${parameter.name}.`);
          let value: unknown = raw;
          if (parameter.schema.type === 'integer') {
            if (!/^\d+$/.test(raw)) invalid(`Invalid ${parameter.name}.`);
            value = Number(raw);
          }
          if (parameter.schema.type === 'boolean') {
            if (raw !== 'true' && raw !== 'false') invalid(`Invalid ${parameter.name}.`);
            value = raw === 'true';
          }
          validateParameter(parameter.schema, value);
          if (parameter.in === 'query') query[parameter.name] = value;
          else params[parameter.name] = raw;
        }
        const version =
          query.dataVersion ??
          (method === 'post' ? request.body?.dataVersion : undefined) ??
          (await datasets.currentVersion());
        const scope: RequestScope = {
          requestId: response.locals.requestId,
          dataVersion: version,
          signal: AbortSignal.timeout(path === '/chat' ? 45_000 : 10_000),
        };
        await datasets.assertSnapshot(scope);
        const result = {
          requestId: scope.requestId,
          dataVersion: scope.dataVersion,
          ...(await handler(scope, query, params, request)),
        };
        validate(schema, result, true);
        if (method === 'get') {
          // requestId is per-request and must not make an otherwise stable entity tag change.
          const { requestId, ...entity } = result;
          const etag =
            '"' + createHash('sha256').update(JSON.stringify(entity)).digest('hex') + '"';
          response.setHeader('ETag', etag);
          response.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');
          if (
            request
              .header('If-None-Match')
              ?.split(',')
              .map((s) => s.trim())
              .includes(etag)
          ) {
            response.status(304).end();
            return;
          }
        }
        response.json(result);
      }
    );
  }
  app.get('/api/health', (_request, response) =>
    response.json({ status: 'ok', service: 'trojan-compass-api' })
  );
  mountBuildings(operation, datasets, search);
  mountScenes(operation, datasets);
  mountPlaces(operation, datasets, search);
  mountSearch(operation, datasets, search);
  mountRouting(operation, routing);
  mountChat(operation, chat);
  app.get('/api/buildings/:buildingId/graph', (_request, _response, next) =>
    next(new Failure('FEATURE_DISABLED', 501, 'Graph inspection is disabled.'))
  );
  app.use('/api/events', (_request, _response, next) =>
    next(new Failure('FEATURE_DISABLED', 501, 'Events are disabled.'))
  );
  app.use((_request, _response, next) =>
    next(new Failure('RESOURCE_NOT_FOUND', 404, 'Endpoint was not found.'))
  );
  app.use(errorHandler);
  return app;
}
export const app = createApp();
