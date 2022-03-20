import { serve, ServeInit } from "https://deno.land/std@0.130.0/http/server.ts";
import { isOk } from "./base/result.ts";
import { Route } from "./router/route.ts";

export type Handler<C, T> = (
  context: C,
  t: T,
  request: Request
) => Response | Promise<Response>;

export type Entry<C, T> = {
  route: Route<C, T>;
  handler: Handler<C, T>;
};

export class App<C> {
  // deno-lint-ignore no-explicit-any
  private entries: Entry<C, any>[] = [];

  constructor(private context: C) {}

  public run(init: ServeInit) {
    return serve((request: Request) => {
      return this.handle(request);
    }, init);
  }

  private async handle(request: Request) {
    for (const entry of this.entries) {
      const resultOrPromise = entry.route(request, this.context);
      const result =
        resultOrPromise instanceof Promise
          ? await resultOrPromise
          : resultOrPromise;
      if (isOk(result)) {
        return entry.handler(this.context, result.value, request);
      }
    }

    const body = JSON.stringify({ message: "NOT FOUND" });
    const response = new Response(body, {
      status: 404,
    });

    return response;
  }

  route<R>(route: Route<C, R>, handler: Handler<C, R>) {
    const entry: Entry<C, R> = {
      route,
      handler,
    };

    this.entries.push(entry);
  }
}
