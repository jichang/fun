// deno-lint-ignore-file no-explicit-any
import {
  Parser,
  equal as equalParser,
  any as anyParser,
  integer as integerParser,
  decimal as decimalParser,
  bigint as bigintParser,
  empty as emptyParser,
} from "../base/parser.ts";
import { isErr, isOk, ok, err, Result } from "../base/result.ts";
import { RouteError, SyncRoute } from "./route.ts";

export class PathParserError extends Error {
  inner: Error | undefined;

  constructor(message: string, inner?: Error) {
    super(message);
    this.inner = inner;
  }
}

export type PathParserResult<T> = [Result<PathParserError, T>, string[]];

export type PathParser<T> = (segments: string[]) => PathParserResult<T>;

export function segment<T>(parser: Parser<T>): PathParser<T> {
  return (segments: string[]) => {
    const segment = segments[0];
    const result = parser(segment);
    if (isOk(result)) {
      return [result, segments.slice(1)];
    } else {
      return [
        err(
          new PathParserError(
            `can not parse path segment ${segment}`,
            result.value
          )
        ),
        segments,
      ];
    }
  };
}

export function literal(target: string): PathParser<string> {
  return segment(equalParser(target));
}

export function integer(): PathParser<number> {
  return segment(integerParser);
}

export function decimal(): PathParser<number> {
  return segment(decimalParser);
}

export function bigint(): PathParser<BigInt> {
  return segment(bigintParser);
}

export function any(): PathParser<string | undefined> {
  return segment(anyParser);
}

export function end(): PathParser<undefined> {
  return segment(emptyParser);
}

export type Combine<T extends readonly PathParser<any>[]> =
  T extends readonly []
    ? []
    : T extends readonly [PathParser<infer U>]
    ? [U]
    : T extends readonly [PathParser<infer U>, ...infer Rest]
    ? Rest extends readonly PathParser<any>[]
      ? [U, ...Combine<Rest>]
      : []
    : [];

export function combine<T extends readonly PathParser<any>[]>(
  parsers: T
): PathParser<Combine<T>> {
  return (segments: string[]) => {
    const value = parsers.reduce<PathParserResult<any[]>>(
      (acc: PathParserResult<any[]>, parser: PathParser<any>) => {
        const [value1, segments1] = acc;
        if (isErr(value1)) {
          return acc;
        } else {
          const result = parser(segments1);
          const [value2, segments2] = result;
          if (isErr(value2)) {
            return result;
          } else {
            return [ok([...value1.value, value2.value]), segments2];
          }
        }
      },
      [ok([]), segments] as PathParserResult<any[]>
    );

    return value as PathParserResult<Combine<T>>;
  };
}

export function forward<T, U>(
  start: PathParser<T>,
  generator: (t: T) => PathParser<U>
): PathParser<[T, U]> {
  return (segments: string[]) => {
    const [result1, segments1] = start(segments);
    if (isOk(result1)) {
      const second = generator(result1.value);
      const [result2, segments2] = second(segments1);
      if (isOk(result2)) {
        return [ok([result1.value, result2.value]), segments2];
      } else {
        return [result2, segments1];
      }
    } else {
      return [result1, segments];
    }
  };
}

export type Choose<T extends readonly PathParser<any>[]> = T extends readonly []
  ? undefined
  : T extends readonly [PathParser<infer U>]
  ? U
  : T extends readonly [PathParser<infer U>, ...infer Rest]
  ? Rest extends readonly PathParser<any>[]
    ? U | Choose<Rest>
    : undefined
  : undefined;

export function choose<T extends readonly PathParser<any>[]>(
  parsers: T
): PathParser<Choose<T>> {
  return (segments: string[]) => {
    for (const parser of parsers) {
      const [result, segments1] = parser(segments);
      if (isOk(result)) {
        return [result, segments1] as PathParserResult<Choose<T>>;
      }
    }

    return [err(new PathParserError("no parser match the segments")), segments];
  };
}

export function path<C, T>(parser: PathParser<T>): SyncRoute<C, T> {
  return (request: Request) => {
    const url = new URL(request.url);
    const segments = url.pathname.split("/");
    const [result] = parser(segments.slice(1));
    if (isOk(result)) {
      return ok(result.value);
    } else {
      return err(
        new RouteError(
          `can not match request with path: ${url.pathname}`,
          result.value
        )
      );
    }
  };
}
