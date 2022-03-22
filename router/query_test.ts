import { assertEquals } from "https://deno.land/std@0.129.0/testing/asserts.ts";
import { query } from "./query.ts";
import { isOk, isErr, Err } from "../base/result.ts";
import { RouteError } from "./route.ts";
import { equal, integer } from "../base/parser.ts";

Deno.test(
  "query function should match request with specified query string",
  () => {
    const route = query({
      a: integer,
      b: equal("b"),
    });
    const request = new Request("https://example.com?a=100&b=b", {
      method: "GET",
    });
    const result = route(request);
    assertEquals(isOk(result), true);
    assertEquals(result.value, { a: 100, b: "b" });
  }
);

Deno.test(
  "query function should not match request with unspecified query string",
  () => {
    const route = query({
      a: integer,
      b: equal("b"),
    });
    const request = new Request("https://example.com?a=100", {
      method: "GET",
    });
    const result = route(request) as Err<RouteError>;
    assertEquals(isErr(result), true);
    assertEquals(
      result.value.message,
      "can not match query parameter b: undefined"
    );
    assertEquals(
      result.value.inner?.message,
      "expected b, but found undefined"
    );
  }
);
