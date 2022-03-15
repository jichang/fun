import { constant, integer, sequence } from "./router/path.ts";

const api = constant("api");
const v1 = constant("v1");

const users = constant("users");
const userId = integer();

const app = {
  routes: [
    {
      pattern: sequence([api, v1, users, userId]),
      handler: () => {},
    },
  ],
};
