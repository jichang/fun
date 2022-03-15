import { Result } from "../base/result.ts";

export class RouteError extends Error {
  inner: Error | undefined;

  constructor(message: string, inner?: Error) {
    super(message);
    this.inner = inner;
  }
}

/*
 * For a route, it can be sync or async
 */
export type SyncRoute<C, U = undefined> = (
  request: Request,
  context?: C
) => Result<RouteError, U>;

export type AsyncRoute<C, U = undefined> = (
  request: Request,
  context?: C
) => Result<RouteError, U> | Promise<Result<RouteError, U>>;

export type Route<C, U = undefined> = SyncRoute<C, U> | AsyncRoute<C, U>;

export function route<C, U>(routes: Route<C, U>[]) {
  return async (request: Request, context: C) => {};
}
