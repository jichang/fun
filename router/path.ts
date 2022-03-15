// deno-lint-ignore-file no-explicit-any
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

export function constant(literal: string): PathParser<string> {
  return (segments: string[]) => {
    if (segments.length === 0) {
      return [
        {
          tag: "err",
          value: new PathParserError("found the end of segments"),
        },
        segments,
      ];
    }

    const segment = segments[0];
    if (segment === literal) {
      return [
        {
          tag: "ok",
          value: segment,
        },
        segments.slice(1),
      ];
    } else {
      return [
        {
          tag: "err",
          value: new PathParserError(
            `segment ${segment} does not match expected literal ${literal}`
          ),
        },
        segments,
      ];
    }
  };
}

export function any(): PathParser<string> {
  return (segments: string[]) => {
    if (segments.length === 0) {
      return [
        {
          tag: "err",
          value: new PathParserError("found the end of segments"),
        },
        segments,
      ];
    }

    const segment = segments[0];
    return [
      {
        tag: "ok",
        value: segment,
      },
      segments.slice(1),
    ];
  };
}

export function end(): PathParser<undefined> {
  return (segments: string[]) => {
    if (segments.length !== 0) {
      return [
        {
          tag: "err",
          value: new PathParserError(
            `expect the end of segments, but found ${segments[0]}`
          ),
        },
        segments,
      ];
    }

    return [
      {
        tag: "ok",
        value: undefined,
      },
      segments.slice(1),
    ];
  };
}

export function integer(radix = 10): PathParser<number> {
  return (segments: string[]) => {
    if (segments.length === 0) {
      return [
        {
          tag: "err",
          value: new PathParserError("found the end of segments"),
        },
        segments,
      ];
    }

    try {
      const segment = segments[0];
      const num = parseInt(segment, radix);
      if (isNaN(num)) {
        return [
          {
            tag: "err",
            value: new PathParserError(
              `segment ${segment} can not be parsed as integer`
            ),
          },
          segments,
        ];
      }

      return [
        {
          tag: "ok",
          value: num,
        },
        segments.slice(1),
      ];
    } catch (e) {
      return [
        {
          tag: "err",
          value: e,
        },
        segments,
      ];
    }
  };
}

export function float(): PathParser<number> {
  return (segments: string[]) => {
    if (segments.length === 0) {
      return [
        {
          tag: "err",
          value: new PathParserError("found the end of segments"),
        },
        segments,
      ];
    }

    try {
      const segment = segments[0];
      const num = parseFloat(segment);
      if (isNaN(num)) {
        return [
          {
            tag: "err",
            value: new PathParserError(
              `segment ${segment} can not be parsed as float`
            ),
          },
          segments,
        ];
      }

      return [
        {
          tag: "ok",
          value: num,
        },
        segments.slice(1),
      ];
    } catch (e) {
      return [
        {
          tag: "err",
          value: e,
        },
        segments,
      ];
    }
  };
}

export function bigint(): PathParser<BigInt> {
  return (segments: string[]) => {
    if (segments.length === 0) {
      return [
        {
          tag: "err",
          value: new PathParserError("found the end of segments"),
        },
        segments,
      ];
    }

    const segment = segments[0];
    try {
      const num = BigInt(segment);

      return [
        {
          tag: "ok",
          value: num,
        },
        segments.slice(1),
      ];
    } catch (e) {
      return [
        {
          tag: "err",
          value: new PathParserError(
            `segment ${segment} can not be parsed as bigint`,
            e
          ),
        },
        segments,
      ];
    }
  };
}

export type SequenceParserValue<T extends PathParser<any>[]> = T extends []
  ? []
  : T extends [PathParser<infer U>]
  ? [U]
  : T extends [PathParser<infer U>, PathParser<infer T>]
  ? [U, T]
  : T extends [PathParser<infer U>, PathParser<infer T>, ...infer Rest]
  ? Rest extends PathParser<any>[]
    ? [U, T, ...SequenceParserValue<Rest>]
    : []
  : [];

export function sequence<T extends PathParser<any>[]>(
  parsers: T
): PathParser<SequenceParserValue<T>> {
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
            return [
              {
                tag: "ok",
                value: [...value1.value, value2.value],
              },
              segments2,
            ];
          }
        }
      },
      [{ tag: "ok", value: [] }, segments] as PathParserResult<any[]>
    );

    return value as PathParserResult<SequenceParserValue<T>>;
  };
}

export function forward<T, U>(
  first: PathParser<T>,
  generator: (t: T) => PathParser<U>
): PathParser<[T, U]> {
  return (segments: string[]) => {
    const [result1, segments1] = first(segments);
    if (isOk(result1)) {
      const second = generator(result1.value);
      const [result2, segments2] = second(segments1);
      if (isOk(result2)) {
        return [
          { tag: "ok", value: [result1.value, result2.value] },
          segments2,
        ];
      } else {
        return [result2, segments1];
      }
    } else {
      return [result1, segments];
    }
  };
}

export type ChooseParserValue<T extends PathParser<any>[]> = T extends []
  ? undefined
  : T extends [PathParser<infer U>]
  ? U
  : T extends [PathParser<infer U>, PathParser<infer T>]
  ? U | T
  : T extends [PathParser<infer U>, PathParser<infer T>, ...infer Rest]
  ? Rest extends PathParser<any>[]
    ? U | T | ChooseParserValue<Rest>
    : undefined
  : undefined;

export function choose<T extends PathParser<any>[]>(
  parsers: T
): PathParser<ChooseParserValue<T>> {
  return (segments: string[]) => {
    for (const parser of parsers) {
      const [result, segments1] = parser(segments);
      if (isOk(result)) {
        return [result, segments1] as PathParserResult<ChooseParserValue<T>>;
      }
    }

    return [
      {
        tag: "err",
        value: new PathParserError("no parser match the segments"),
      },
      segments,
    ];
  };
}

export function path<C, T>(parser: PathParser<T>): SyncRoute<C, T> {
  return (request: Request) => {
    const url = new URL(request.url);
    const segments = url.pathname.split("/");
    const [result] = parser(segments);
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
