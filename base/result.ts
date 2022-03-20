export type Ok<T> = {
  kind: "ok";
  value: T;
};

export type Err<E> = {
  kind: "err";
  value: E;
};

export type Result<E, T> = Ok<T> | Err<E>;

export function ok<E, T>(value: T): Result<E, T> {
  return {
    kind: "ok",
    value,
  };
}

export function isOk<E, T>(result: Result<E, T>): result is Ok<T> {
  return result.kind === "ok";
}

export function err<E, T>(value: E): Result<E, T> {
  return {
    kind: "err",
    value,
  };
}

export function isErr<E, T>(result: Result<E, T>): result is Err<E> {
  return result.kind === "err";
}

export function map<E, T1, T2>(
  mapper: (t1: T1) => T2,
  result: Result<E, T1>
): Result<E, T2> {
  if (isErr(result)) {
    return result;
  } else {
    return {
      kind: "ok",
      value: mapper(result.value),
    };
  }
}
