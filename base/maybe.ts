export type Some<T> = {
  kind: "some";
  value: T;
};

export type None = {
  kind: "none";
};

export type Maybe<T> = Some<T> | None;

export function some<T>(value: T): Maybe<T> {
  return {
    kind: "some",
    value,
  };
}

export function isSome<T>(maybe: Maybe<T>): maybe is Some<T> {
  return maybe.kind === "some";
}

export const none: None = {
  kind: "none",
};

export function isNone<T>(maybe: Maybe<T>): maybe is None {
  return maybe === none;
}

export function map<T1, T2>(
  mapper: (t1: T1) => T2,
  result: Maybe<T1>
): Maybe<T2> {
  if (isNone(result)) {
    return result;
  } else {
    return {
      kind: "some",
      value: mapper(result.value),
    };
  }
}
