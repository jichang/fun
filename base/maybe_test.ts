import { assertEquals } from "https://deno.land/std@0.129.0/testing/asserts.ts";
import { isNone, isSome, map, Maybe, None, none, Some, some } from "./maybe.ts";

Deno.test("map function should call mapper for Some<T> value", () => {
  const maybe = some(0) as Maybe<number>;
  const result = map((num: number) => {
    return num + 1;
  }, maybe) as Some<number>;
  assertEquals(isSome(result), true);
  assertEquals(result.value, 1);
});

Deno.test("map function should call mapper for None value", () => {
  const maybe = none as Maybe<number>;
  const result = map((num: number) => {
    return num + 1;
  }, maybe) as None;
  assertEquals(isNone(result), true);
});
