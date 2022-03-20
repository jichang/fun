import { RouteError, SyncRoute } from "./route.ts";
import { ok, err, Result } from "../base/result.ts";

export function method<C>(method: string): SyncRoute<C, string> {
  return (request: Request): Result<RouteError, string> => {
    if (request.method === method) {
      return ok(method);
    } else {
      return err(
        new RouteError(
          `request should use ${method}, but it use ${request.method}`
        )
      );
    }
  };
}
