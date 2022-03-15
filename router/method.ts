import { RouteError, SyncRoute } from "./route.ts";
import { ok, err, Result } from "../base/result.ts";

export function httpMethod<C>(method: string): SyncRoute<C, boolean> {
  return (request: Request): Result<RouteError, boolean> => {
    if (request.method === method) {
      return ok(true);
    } else {
      return err(
        new RouteError(
          `request should use ${method}, but it use ${request.method}`
        )
      );
    }
  };
}

export const OPTIONS = httpMethod("OPTIONS");
export const HEAD = httpMethod("HEAD");
export const GET = httpMethod("GET");
export const POST = httpMethod("POST");
export const PUT = httpMethod("PUT");
export const PATCH = httpMethod("PATCH");
export const DELETE = httpMethod("DELETE");
export const TRACE = httpMethod("TRACE");
