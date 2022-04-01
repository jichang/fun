// Run this program with 

import { method } from "./router/method.ts";
import { literal, integer, combine, rest, path } from "./router/path.ts";
import { route } from "./router/route.ts";
import { App } from "./app.ts";
import { query } from "./router/query.ts";
import { equal } from "./base/parser.ts";
import { staticFileHandler } from "./handlers/staticFileHandler.ts";
import { join, fromFileUrl, dirname } from "https://deno.land/std@0.133.0/path/mod.ts";

type Context = {
  framework: "Fun";
};

const context: Context = {
  framework: "Fun",
};

const get = method<Context>("GET");

const apiSegment = literal("api");
const v1Segment = literal("v1");
const usersSegment = literal("users");
const userIdSegment = integer();
const userPathParser = combine([
  apiSegment,
  v1Segment,
  usersSegment,
  userIdSegment,
] as const);

// match query parameter
const queryParams = query({
  role: equal("admin"),
});

const userRoutePaths = [get, path(userPathParser), queryParams] as const;
const userRoute = route<Context, typeof userRoutePaths>(userRoutePaths);

function handler(
  context: Context,
  [method, [api, v1, users, userId], queryParams]: [
    string,
    [string, string, string, number],
    { role: string }
  ]
) {
  const body = {
    method, // GET
    path: [api, v1, users, userId], // ["api", "v1", "users", 100]
    queryParams, // { role: 'admin' }
    context,
  };
  return new Response(JSON.stringify(body), {
    status: 200,
  });
}

// server static files under specified folder
const staticSegment = literal("static");
const staticPathParser = combine([
  staticSegment,
  rest()
] as const);
const staticRoutePaths = [get, path(staticPathParser)] as const;
const staticRoute = route<Context, typeof staticRoutePaths>(staticRoutePaths);

const app = new App<Context>(context);
app.route(userRoute, handler);

const dirPath = dirname(fromFileUrl(import.meta.url));
app.route(staticRoute, staticFileHandler({ rootDir: join(dirPath, 'static') }));

app.run({
  port: 8080,
});
