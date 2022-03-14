// deno-lint-ignore-file no-explicit-any
import { isOk, Result } from "./result.ts";
import { isErr } from "./result.ts";

export class ParserError extends Error {
  inner: Error | undefined;

  constructor(message: string, inner?: Error) {
    super(message);
    this.inner = inner;
  }
}

export type ParserResult<T> = [Result<ParserError, T>, string[]];

export type Parser<T> = (segments: string[]) => ParserResult<T>;

export function constant(literal: string): Parser<string> {
  return (segments: string[]) => {
    if (segments.length === 0) {
      return [
        {
          tag: "err",
          value: new ParserError("found the end of segments"),
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
          value: new ParserError(
            `segment ${segment} does not match expected literal ${literal}`
          ),
        },
        segments,
      ];
    }
  };
}

export function any(): Parser<string> {
  return (segments: string[]) => {
    if (segments.length === 0) {
      return [
        {
          tag: "err",
          value: new ParserError("found the end of segments"),
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

export function end(): Parser<undefined> {
  return (segments: string[]) => {
    if (segments.length !== 0) {
      return [
        {
          tag: "err",
          value: new ParserError(
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

export function integer(radix = 10): Parser<number> {
  return (segments: string[]) => {
    if (segments.length === 0) {
      return [
        {
          tag: "err",
          value: new ParserError("found the end of segments"),
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
            value: new ParserError(
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

export function float(): Parser<number> {
  return (segments: string[]) => {
    if (segments.length === 0) {
      return [
        {
          tag: "err",
          value: new ParserError("found the end of segments"),
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
            value: new ParserError(
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

export function bigint(): Parser<BigInt> {
  return (segments: string[]) => {
    if (segments.length === 0) {
      return [
        {
          tag: "err",
          value: new ParserError("found the end of segments"),
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
          value: new ParserError(
            `segment ${segment} can not be parsed as bigint`,
            e
          ),
        },
        segments,
      ];
    }
  };
}

export type SequenceParserValue<T extends Parser<any>[]> = T extends []
  ? []
  : T extends [Parser<infer U>]
  ? [U]
  : T extends [Parser<infer U>, Parser<infer T>]
  ? [U, T]
  : T extends [Parser<infer U>, Parser<infer T>, ...infer Rest]
  ? Rest extends Parser<any>[]
    ? [U, T, ...SequenceParserValue<Rest>]
    : []
  : [];

export function sequence<T extends Parser<any>[]>(
  parsers: T
): Parser<SequenceParserValue<T>> {
  return (segments: string[]) => {
    const value = parsers.reduce<ParserResult<any[]>>(
      (acc: ParserResult<any[]>, parser: Parser<any>) => {
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
      [{ tag: "ok", value: [] }, segments] as ParserResult<any[]>
    );

    return value as ParserResult<SequenceParserValue<T>>;
  };
}

export function forward<T, U>(
  first: Parser<T>,
  generator: (t: T) => Parser<U>
): Parser<[T, U]> {
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
