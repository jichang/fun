import { assertEquals } from "https://deno.land/std@0.129.0/testing/asserts.ts";
import type { Result } from "./result.ts";
import { map, isOk, isErr } from "./result.ts";

Deno.test("map function should call mapper for Ok<T> value", () => {
  const ok: Result<Error, number> = {
    kind: "ok",
    value: 0,
  };
  const result = map((value: number) => {
    return value + 1;
  }, ok);
  assertEquals(isOk(result), true);
  assertEquals(result.value, 1);
});

Deno.test("map function should not call mapper for Err<T> value", () => {
  const ok: Result<number, number> = {
    kind: "err",
    value: 0,
  };
  const result = map((value: number) => {
    return ++value;
  }, ok);
  assertEquals(isErr(result), true);
  assertEquals(result.value, 0);
});
