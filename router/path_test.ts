import { assertEquals } from "https://deno.land/std@0.129.0/testing/asserts.ts";
import { isOk, isErr } from "../base/result.ts";
import {
  any,
  end,
  constant,
  integer,
  float,
  bigint,
  sequence,
  forward,
  choose,
} from "./path.ts";
import type { PathParserError } from "./path.ts";
import type { Err } from "../base/result.ts";

Deno.test("constant should return Ok<T> for matched segment", () => {
  const segment = "any segment";
  const parser = constant(segment);
  const [result, segments] = parser(["any segment"]);
  assertEquals(isOk(result), true);
  assertEquals(result.value, "any segment");
  assertEquals(segments.length, 0);
});

Deno.test(
  "constant should return Err<ParserError> for unmatched segment",
  () => {
    const literal = "any segment";
    const parser = constant(literal);
    const segment = "another segment";
    const [result, segments] = parser([segment]) as [
      Err<PathParserError>,
      string[]
    ];
    assertEquals(isErr(result), true);
    assertEquals(
      result.value.message,
      `segment ${segment} does not match expected literal ${literal}`
    );
    assertEquals(segments.length, 1);
    assertEquals(segments[0], segment);
  }
);

Deno.test("any should return Ok<T> for any segment", () => {
  const parser = any();
  const segment = "another segment";
  const [result, segments] = parser([segment]);
  assertEquals(isOk(result), true);
  assertEquals(result.value, segment);
  assertEquals(segments.length, 0);
});

Deno.test("end should return Ok<T> for empty segments", () => {
  const parser = end();
  const [result, segments] = parser([]);
  assertEquals(isOk(result), true);
  assertEquals(result.value, undefined);
  assertEquals(segments.length, 0);
});

Deno.test("end should return Err<ParserError> for non-empty segment", () => {
  const parser = end();
  const segment = "another segment";
  const [result, segments] = parser([segment]) as [
    Err<PathParserError>,
    string[]
  ];
  assertEquals(isErr(result), true);
  assertEquals(
    result.value.message,
    `expect the end of segments, but found ${segment}`
  );
  assertEquals(segments.length, 1);
  assertEquals(segments[0], segment);
});

Deno.test("integer should return Ok<T> for integer-like segment", () => {
  const parser = integer();
  const segment = "100";
  const [result, segments] = parser([segment]);
  assertEquals(isOk(result), true);
  assertEquals(result.value, 100);
  assertEquals(segments.length, 0);
});

Deno.test(
  "integer should return Err<ParserError> for integer-unlike segment",
  () => {
    const parser = integer();
    const segment = "hello";
    const [result, segments] = parser([segment]) as [
      Err<PathParserError>,
      string[]
    ];
    assertEquals(isErr(result), true);
    assertEquals(
      result.value.message,
      `segment ${segment} can not be parsed as integer`
    );
    assertEquals(segments.length, 1);
    assertEquals(segments[0], segment);
  }
);

Deno.test("float should return Ok<T> for float-like segment", () => {
  const parser = float();
  const [result, segments] = parser(["9.9"]);
  assertEquals(isOk(result), true);
  assertEquals(result.value, 9.9);
  assertEquals(segments.length, 0);
});

Deno.test(
  "float should return Err<ParserError> for float-unlike segment",
  () => {
    const parser = float();
    const segment = "hello";
    const [result, segments] = parser([segment]) as [
      Err<PathParserError>,
      string[]
    ];
    assertEquals(isErr(result), true);
    assertEquals(
      result.value.message,
      `segment ${segment} can not be parsed as float`
    );
    assertEquals(segments.length, 1);
    assertEquals(segments[0], segment);
  }
);

Deno.test("bigint should return Ok<T> for bigint-like segment", () => {
  const parser = bigint();
  const [result, segments] = parser(["10000000000000000000000"]);
  assertEquals(isOk(result), true);
  assertEquals(result.value, BigInt("10000000000000000000000"));
  assertEquals(segments.length, 0);
});

Deno.test(
  "bigint should return Err<ParserError> for bigint-unlike segment",
  () => {
    const parser = bigint();
    const segment = "hello";
    const [result, segments] = parser([segment]) as [
      Err<PathParserError>,
      string[]
    ];
    assertEquals(isErr(result), true);
    assertEquals(
      result.value.message,
      `segment ${segment} can not be parsed as bigint`
    );
    assertEquals(segments.length, 1);
    assertEquals(segments[0], segment);
  }
);

Deno.test("sequence should return Ok<T> for matched segments", () => {
  const parser = sequence([integer(), float(), bigint()]);
  const [result, segments] = parser(["100", "100.0", "100000000000000000000"]);
  assertEquals(isOk(result), true);
  assertEquals(result.value, [100, 100.0, BigInt("100000000000000000000")]);
  assertEquals(segments.length, 0);
});

Deno.test(
  "sequence should return Err<ParserError> for unmatched segments",
  () => {
    const parser = sequence([integer(), float()]);
    const [result, segments] = parser(["aaa", "100.0"]) as [
      Err<PathParserError>,
      string[]
    ];
    assertEquals(isErr(result), true);
    assertEquals(
      result.value.message,
      `segment aaa can not be parsed as integer`
    );
    assertEquals(segments.length, 2);
  }
);

Deno.test("forward should return Ok<T> for matched segments", () => {
  const parser = forward(integer(), (_num: number) => {
    return sequence([float(), bigint()]);
  });
  const [result, segments] = parser(["100", "100.0", "100000000000000000000"]);
  assertEquals(isOk(result), true);
  assertEquals(result.value, [100, [100.0, BigInt("100000000000000000000")]]);
  assertEquals(segments.length, 0);
});

Deno.test(
  "forward should return Err<ParserError> for unmatched segments",
  () => {
    const parser = forward(integer(), (_num: number) => {
      return sequence([float(), bigint()]);
    });
    const [result, segments] = parser(["aaa", "100.0"]) as [
      Err<PathParserError>,
      string[]
    ];
    assertEquals(isErr(result), true);
    assertEquals(
      result.value.message,
      `segment aaa can not be parsed as integer`
    );
    assertEquals(segments.length, 2);
  }
);

Deno.test("choose should return Ok<T> for matched segments", () => {
  const parser = choose([integer(), float()]);
  const [result, segments] = parser(["100.0"]);
  assertEquals(isOk(result), true);
  assertEquals(result.value, 100);
  assertEquals(segments.length, 0);
});

Deno.test(
  "choose should return Err<ParserError> for unmatched segments",
  () => {
    const parser = choose([integer(), integer()]);
    const [result, segments] = parser(["a100.0"]) as [
      Err<PathParserError>,
      string[]
    ];
    assertEquals(isErr(result), true);
    assertEquals(result.value.message, `no parser match the segments`);
    assertEquals(segments.length, 1);
  }
);
