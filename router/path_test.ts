import { assertEquals } from "https://deno.land/std@0.129.0/testing/asserts.ts";
import { isOk, isErr } from "../base/result.ts";
import {
  any,
  end,
  literal,
  integer,
  decimal,
  bigint,
  combine,
  forward,
  choose,
} from "./path.ts";
import type { PathParserError } from "./path.ts";
import type { Err } from "../base/result.ts";

Deno.test("literal should return Ok<T> for matched segment", () => {
  const segment = "any segment";
  const parser = literal(segment);
  const [result, segments] = parser(["any segment"]);
  assertEquals(isOk(result), true);
  assertEquals(result.value, "any segment");
  assertEquals(segments.length, 0);
});

Deno.test(
  "literal should return Err<ParserError> for unmatched segment",
  () => {
    const target = "any segment";
    const parser = literal(target);
    const segment = "another segment";
    const [result, segments] = parser([segment]) as [
      Err<PathParserError>,
      string[]
    ];
    assertEquals(isErr(result), true);
    assertEquals(
      result.value.message,
      `can not parse path segment another segment`
    );
    assertEquals(
      result.value.inner?.message,
      "expected any segment, but found another segment"
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
    `can not parse path segment another segment`
  );
  assertEquals(
    result.value.inner?.message,
    "expected undefined, but found another segment"
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
    const segment = "another segment";
    const [result, segments] = parser([segment]) as [
      Err<PathParserError>,
      string[]
    ];
    assertEquals(isErr(result), true);
    assertEquals(
      result.value.message,
      `can not parse path segment another segment`
    );
    assertEquals(
      result.value.inner?.message,
      "another segment is not valid integer format"
    );
    assertEquals(segments.length, 1);
    assertEquals(segments[0], segment);
  }
);

Deno.test("decimal should return Ok<T> for decimal-like segment", () => {
  const parser = decimal();
  const [result, segments] = parser(["9.9"]);
  assertEquals(isOk(result), true);
  assertEquals(result.value, 9.9);
  assertEquals(segments.length, 0);
});

Deno.test(
  "decimal should return Err<ParserError> for decimal-unlike segment",
  () => {
    const parser = decimal();
    const segment = "another segment";
    const [result, segments] = parser([segment]) as [
      Err<PathParserError>,
      string[]
    ];
    assertEquals(isErr(result), true);
    assertEquals(
      result.value.message,
      `can not parse path segment another segment`
    );
    assertEquals(
      result.value.inner?.message,
      "another segment is not valid decimal format"
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
    const segment = "another segment";
    const [result, segments] = parser([segment]) as [
      Err<PathParserError>,
      string[]
    ];
    assertEquals(isErr(result), true);
    assertEquals(
      result.value.message,
      `can not parse path segment another segment`
    );
    assertEquals(
      result.value.inner?.message,
      "another segment is not valid big int format"
    );
    assertEquals(segments.length, 1);
    assertEquals(segments[0], segment);
  }
);

Deno.test("sequence should return Ok<T> for matched segments", () => {
  const parser = combine([integer(), decimal(), bigint()]);
  const [result, segments] = parser(["100", "100.0", "100000000000000000000"]);
  assertEquals(isOk(result), true);
  assertEquals(result.value, [100, 100.0, BigInt("100000000000000000000")]);
  assertEquals(segments.length, 0);
});

Deno.test(
  "sequence should return Err<ParserError> for unmatched segments",
  () => {
    const parser = combine([integer(), decimal()]);
    const [result, segments] = parser(["aaa", "100.0"]) as [
      Err<PathParserError>,
      string[]
    ];
    assertEquals(isErr(result), true);
    assertEquals(result.value.message, `can not parse path segment aaa`);
    assertEquals(
      result.value.inner?.message,
      "aaa is not valid integer format"
    );
    assertEquals(segments.length, 2);
  }
);

Deno.test("forward should return Ok<T> for matched segments", () => {
  const parser = forward(integer(), (_num: number) => {
    return combine([decimal(), bigint()]);
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
      return combine([decimal(), bigint()]);
    });
    const [result, segments] = parser(["aaa", "100.0"]) as [
      Err<PathParserError>,
      string[]
    ];
    assertEquals(isErr(result), true);
    assertEquals(result.value.message, `can not parse path segment aaa`);
    assertEquals(
      result.value.inner?.message,
      "aaa is not valid integer format"
    );
    assertEquals(segments.length, 2);
  }
);

Deno.test("choose should return Ok<T> for matched segments", () => {
  const parser = choose([integer(), decimal()]);
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
