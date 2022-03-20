import { assertEquals } from "https://deno.land/std@0.129.0/testing/asserts.ts";
import {
  integer,
  decimal,
  ParserError,
  any,
  equal,
  bigint,
  all,
  oneOf,
  unequal,
} from "./parser.ts";
import { Err, isErr, isOk } from "./result.ts";

Deno.test("integer should return Ok<number> for valid input", () => {
  const result = integer("1000");
  assertEquals(isOk(result), true);
  assertEquals(result.value, 1000);
});

Deno.test("integer should return Err<ParserError> for invalid input", () => {
  const result = integer("a1000") as Err<ParserError>;
  assertEquals(isErr(result), true);
  assertEquals(result.value.message, "a1000 is not valid integer format");
});

Deno.test("bigint should return Ok<BigInt> for valid input", () => {
  const result = bigint("100000000000000000");
  assertEquals(isOk(result), true);
  assertEquals(typeof result.value, "bigint");
  assertEquals(result.value, BigInt("100000000000000000"));
});

Deno.test("bigint should return Err<ParserError> for invalid input", () => {
  const result = bigint("a1000") as Err<ParserError>;
  assertEquals(isErr(result), true);
  assertEquals(result.value.message, "a1000 is not valid big int format");
});

Deno.test("decimal should return Ok<number> for valid input", () => {
  const result = decimal("1000");
  assertEquals(isOk(result), true);
  assertEquals(result.value, 1000);
});

Deno.test("decimal should return Ok<number> for valid input", () => {
  const result = decimal("1000.9");
  assertEquals(isOk(result), true);
  assertEquals(result.value, 1000.9);
});

Deno.test("decimal should return Err<ParserError> for invalid input", () => {
  const result = decimal("a1000.9") as Err<ParserError>;
  assertEquals(isErr(result), true);
  assertEquals(result.value.message, "a1000.9 is not valid decimal format");
});

Deno.test("any should return Ok<string> for random input", () => {
  const result = any("1000.9");
  assertEquals(isOk(result), true);
  assertEquals(result.value, "1000.9");
});

Deno.test("equal should return Ok<string> for matched string", () => {
  const result = equal("1000.9")("1000.9");
  assertEquals(isOk(result), true);
  assertEquals(result.value, "1000.9");
});

Deno.test("equal should return Err<ParserError> for unmatched input", () => {
  const result = equal("1000.9")("1000.8") as Err<ParserError>;
  assertEquals(isErr(result), true);
  assertEquals(result.value.message, "expected 1000.9, but found 1000.8");
});

Deno.test("unequal should return Ok<string> for unmatched string", () => {
  const result = unequal("1000.9")("1000.8");
  assertEquals(isOk(result), true);
  assertEquals(result.value, "1000.8");
});

Deno.test("all should return Ok<T> for valid input", () => {
  const parser = all([integer, decimal, bigint] as const);
  const result = parser("100");
  assertEquals(isOk(result), true);
  assertEquals(result.value, [100, 100.0, BigInt("100")]);
});

Deno.test("sequence should return Err<ParserError> for unvalid input", () => {
  const parser = all([integer, decimal, bigint] as const);
  const result = parser("100.0") as Err<ParserError>;
  assertEquals(isErr(result), true);
  assertEquals(result.value.message, "100.0 is not valid integer format");
});

Deno.test("oneOf should return Ok<T> for valid input", () => {
  const parser = oneOf([integer, decimal, bigint] as const);
  const result = parser("100000.9");
  assertEquals(isOk(result), true);
  assertEquals(result.value, 100000.9);
});

Deno.test("oneOf should return Err<ParserError> for unvalid input", () => {
  const parser = oneOf([integer, decimal, bigint] as const);
  const result = parser("a100.0") as Err<ParserError>;
  assertEquals(isErr(result), true);
  assertEquals(result.value.message, "a100.0 does not match any parser");
});
