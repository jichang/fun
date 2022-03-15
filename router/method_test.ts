import { assertEquals } from "https://deno.land/std@0.129.0/testing/asserts.ts";
import { httpMethod } from "./method.ts";
import { isOk, isErr, Err } from "../base/result.ts";
import { RouteError } from "./route.ts";

Deno.test(
  "httpMethod function should match request with specified method",
  () => {
    const route = httpMethod("GET");
    const request = new Request("https://example.com", {
      method: "GET",
    });
    const result = route(request);
    assertEquals(isOk(result), true);
    assertEquals(result.value, true);
  }
);

Deno.test(
  "httpMethod function should not match request with unspecified method",
  () => {
    const route = httpMethod("POST");
    const request = new Request("https://example.com", {
      method: "GET",
    });
    const result = route(request) as Err<RouteError>;
    assertEquals(isErr(result), true);
    assertEquals(
      result.value.message,
      `request should use POST, but it use GET`
    );
  }
);
