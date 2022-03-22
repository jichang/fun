// deno-lint-ignore-file no-explicit-any
import { Parser } from "../base/parser.ts";
import { err, isOk, ok, Result } from "../base/result.ts";
import { RouteError, SyncRoute } from "./route.ts";

export type ParserValue<T> = T extends Parser<infer U> ? U : unknown;

export type Query<T> = {
  [key in keyof T]: ParserValue<T[key]>;
};

export function query<C, T extends Record<string, Parser<any>>>(
  parser: T
): SyncRoute<C, Query<T>> {
  return (request: Request): Result<RouteError, Query<T>> => {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    const result = {} as Query<T>;
    for (const key in parser) {
      const fieldParser = parser[key];
      const fieldValue = searchParams.get(key) || undefined;
      const fieldResult = fieldParser(fieldValue);
      if (isOk(fieldResult)) {
        result[key] = fieldResult.value;
      } else {
        return err(
          new RouteError(
            `can not match query parameter ${key}: ${fieldValue}`,
            fieldResult.value
          )
        );
      }
    }

    return ok(result);
  };
}
