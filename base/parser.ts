// deno-lint-ignore-file no-explicit-any
import { ok, err, Result, isOk, isErr } from "./result.ts";

export class ParserError extends Error {
  constructor(message: string, public inner?: Error) {
    super(message);
  }
}

export type Parser<T> = (str: string | undefined) => Result<ParserError, T>;

export function equal(target: string): Parser<string> {
  return (str: string | undefined) => {
    if (str === target) {
      return ok(str);
    } else {
      return err(new ParserError(`expected ${target}, but found ${str}`));
    }
  };
}

export function unequal(target: string): Parser<string | undefined> {
  return not(equal(target));
}

export function empty(str: string | undefined): Result<ParserError, undefined> {
  if (str === undefined) {
    return ok(undefined);
  } else {
    return err(new ParserError(`expected undefined, but found ${str}`));
  }
}

export function any(
  str: string | undefined
): Result<ParserError, string | undefined> {
  return ok(str);
}

export function integer(str: string | undefined): Result<ParserError, number> {
  if (str === undefined) {
    return err(new ParserError(`expected integer, but found undefined`));
  }

  try {
    const isValid = /^-?\d+$/.test(str);
    if (isValid) {
      const num = Number(str);
      if (!isNaN(num)) {
        return ok(Number(str));
      } else {
        return err(new ParserError(`${str} is not valid integer format`));
      }
    } else {
      return err(new ParserError(`${str} is not valid integer format`));
    }
  } catch (e) {
    return err(new ParserError(`error when parsing ${str} as integer`, e));
  }
}

export function bigint(str: string | undefined): Result<ParserError, BigInt> {
  if (str === undefined) {
    return err(new ParserError(`expected bigint, but found undefined`));
  }

  try {
    const isValid = /^-?\d+$/.test(str);
    if (isValid) {
      const num = BigInt(str);
      return ok(num);
    } else {
      return err(new ParserError(`${str} is not valid big int format`));
    }
  } catch (e) {
    return err(new ParserError(`error when parsing ${str} as big int`, e));
  }
}

export function decimal(str: string | undefined): Result<ParserError, number> {
  if (str === undefined) {
    return err(new ParserError(`expected decimal, but found undefined`));
  }

  try {
    const isValid = /^-?\d+(\.\d+)?$/.test(str);
    if (isValid) {
      const num = Number(str);
      if (!isNaN(num)) {
        return ok(Number(str));
      } else {
        return err(new ParserError(`${str} is not valid decimal format`));
      }
    } else {
      return err(new ParserError(`${str} is not valid decimal format`));
    }
  } catch (e) {
    return err(new ParserError(`error when parsing ${str} as decimal`, e));
  }
}

export function not<T>(parser: Parser<T>): Parser<string | undefined> {
  return (str: string | undefined) => {
    const result = parser(str);
    if (isErr(result)) {
      return ok(str);
    } else {
      return err(
        new ParserError(
          `should not be parsed by parser ${parser}, but found ${str}`
        )
      );
    }
  };
}

export type OneOf<T extends readonly Parser<any>[]> = T extends []
  ? void
  : T extends readonly [Parser<infer U>]
  ? U
  : T extends readonly [Parser<infer U>, ...infer Rest]
  ? Rest extends readonly Parser<any>[]
    ? U | OneOf<Rest>
    : void
  : void;

export function oneOf<T extends readonly Parser<any>[]>(
  parsers: T
): Parser<OneOf<T>> {
  return (str: string | undefined) => {
    for (const parser of parsers) {
      const result = parser(str);
      if (isOk(result)) {
        return result;
      }
    }

    return err(new ParserError(`${str} does not match any parser`));
  };
}

export type All<T extends readonly Parser<any>[]> = T extends []
  ? []
  : T extends readonly [Parser<infer U>]
  ? [U]
  : T extends readonly [Parser<infer U>, ...infer Rest]
  ? Rest extends readonly Parser<any>[]
    ? [U, ...All<Rest>]
    : []
  : [];

export function all<T extends readonly Parser<any>[]>(
  parsers: T
): Parser<All<T>> {
  return (str: string | undefined) => {
    const values: any[] = [];
    for (const parser of parsers) {
      const result = parser(str);
      if (isOk(result)) {
        values.push(result.value);
      } else {
        return result;
      }
    }

    return ok(values as All<T>);
  };
}
