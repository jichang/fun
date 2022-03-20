# Fun is a simple functional web application framework for Deno


## How to build web application with Fun

There are 3 steps you need to do.

1. Define a global context

   context represents global values shared by the entire web application, like configuration, database connection. In order to build a robust web application, it's highly recommended that you initialize those resources before starting the application. It can be any data you need when you run the application.

   ```TypeScript
    type Context = {
      database: string,
    }

    const context: Context = {
      database: "postgresql://localhost"
    };
   ```

2. Write routes and handlers

   route is build with different parser, let's say you want to build an parser match the request `GET /api/v1/users/100` (*100* can be any integer), you can write code

   ```TypeScript
    // match http method GET
    const get = method<Context>("GET");

    const apiSegment = literal("api");
    const v1Segment = literal("v1");
    const usersSegment = literal("users");
    // match any segment that can be parsed as an integer
    const userIdSegment = integer();

    // match http path /api/v1/users/{any integer}
    const pathParser = combine([
      apiSegment,
      v1Segment,
      usersSegment,
      userIdSegment,
    ] as const);

    // build an route that match GET /api/v1/users/{any integer}
    const paths = [get, path(pathParser)] as const;
    const userRoute = route<Context, typeof paths>(paths);
   ```

   userRoute's type will looks like below

   ```TypeScript
   // Route has 2 generic parameters
   // 1st one is the type of Context we defined above
   // 2nd one is the return value of route parser, in this case
   //   type:    [string, [string, string, string, number]]
   //   parser:  [get,    [api,    v1,     users,  userId]]
   const userRoute: Route<Context, [string, [string, string, string, number]]>
   ```

   In order to handle the request that match the type of userRoute, you also need to
   provide a function which type should match with userRoute

   ```TypeScript
   function handler(context: Context, params: [string, [string, string, string, number]]>): Response;
   ```

   For example, you can just return context and params in handler

   ```TypeScript
   function handler(context: Context, params: [string, [string, string, string, number]]) {
     const body = {
       method, // GET
       path: [api, v1, users, userId], // ["api", "v1", "users", 100]
       context,
     };
     return new Response(JSON.stringify(body), {
       status: 200,
     });
   }
   ```

3. Create an web application and register route & handler

    ```TypeScript
    const app = new App<Context>(context);
    app.route(userRoute, handler);

    app.run({
      port: 8080,
    });
    ```

Now, if you visit http://localhost:8080/api/v1/users/100, the response will be

```JSON
   {"method":"GET","path":["api","v1","users",100],"context":{"framework":"Fun"}}
```

Check [./exmple.ts](./example.ts) for a complete example.
