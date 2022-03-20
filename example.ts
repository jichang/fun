import { method } from "./router/method.ts";
import { literal, integer, combine, path } from "./router/path.ts";
import { route } from "./router/route.ts";
import { App } from "./app.ts";

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
const pathParser = combine([
  apiSegment,
  v1Segment,
  usersSegment,
  userIdSegment,
] as const);
const paths = [get, path(pathParser)] as const;
const userRoute = route<Context, typeof paths>(paths);

function handler(
  context: Context,
  [method, [api, v1, users, userId]]: [string, [string, string, string, number]]
) {
  const body = {
    method, // GET
    path: [api, v1, users, userId], // ["api", "v1", "users", 100]
    context,
  };
  return new Response(JSON.stringify(body), {
    status: 200,
  });
}

const app = new App<Context>(context);
app.route(userRoute, handler);

app.run({
  port: 8080,
});
