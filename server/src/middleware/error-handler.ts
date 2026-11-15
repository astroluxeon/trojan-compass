import type { ErrorRequestHandler } from 'express';
import { Failure } from './failure.js';
export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (response.headersSent) return;
  let failure = error instanceof Failure ? error : undefined;
  if (!failure && error.type === 'entity.too.large')
    failure = new Failure('PAYLOAD_TOO_LARGE', 413, 'JSON body exceeds 1 MiB.');
  if (!failure && (error.type === 'entity.parse.failed' || error instanceof URIError))
    failure = new Failure('INVALID_REQUEST', 400, 'Malformed request.');
  if (!failure && (error.name === 'TimeoutError' || error.name === 'AbortError'))
    failure = new Failure('DEPENDENCY_TIMEOUT', 504, 'Request timed out.');
  failure ??= new Failure('INTERNAL_ERROR', 500, 'The server could not complete this request.');
  if (failure.httpStatus === 500)
    console.error(
      'Request failed',
      response.locals.requestId,
      error instanceof Error ? error.message : 'Unknown error'
    );
  response.status(failure.httpStatus).setHeader('Cache-Control', 'no-store');
  response.json({
    error: {
      code: failure.code,
      message: failure.message,
      requestId: response.locals.requestId,
      ...(failure.fieldErrors ? { fieldErrors: failure.fieldErrors } : {}),
    },
  });
};
