import { isOk, ok, Result } from "../base/result.ts";

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
export type SyncRoute<C, U> = (
  request: Request,
  context?: C
) => Result<RouteError, U>;

export type AsyncRoute<C, U> = (
  request: Request,
  context?: C
) => Result<RouteError, U> | Promise<Result<RouteError, U>>;

export type Route<C, U> = SyncRoute<C, U> | AsyncRoute<C, U>;

export type Combine<
  C,
  // deno-lint-ignore no-explicit-any
  T extends readonly Route<C, any>[]
> = T extends readonly []
  ? []
  : T extends readonly [Route<C, infer U>]
  ? [U]
  : T extends readonly [Route<C, infer U>, ...infer Rest]
  ? // deno-lint-ignore no-explicit-any
    Rest extends readonly Route<C, any>[]
    ? [U, ...Combine<C, Rest>]
    : []
  : [];

// deno-lint-ignore no-explicit-any
export function route<C, R extends readonly Route<C, any>[]>(
  routes: R
): Route<C, Combine<C, R>> {
  return async (request: Request, context) => {
    // deno-lint-ignore no-explicit-any
    const results: any[] = [];

    for (const route of routes) {
      const resultOrPromise = route(request, context);
      const result =
        resultOrPromise instanceof Promise
          ? await resultOrPromise
          : resultOrPromise;
      if (isOk(result)) {
        results.push(result.value);
      } else {
        console.log(result);
        return result;
      }
    }

    return ok(results as Combine<C, R>);
  };
}
