import { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import { logger } from "hono/logger";
import { globalExceptionHandler } from "./common/error/global-exception-handler";
import { sessionMiddleware } from "./common/middlewares/session.middleware";
import type { Env } from "./common/types/types";
import { zodValidationHook } from "./common/utils/zod-validation-hook";
import { auth } from "./features/auth/auth";
import conversationRoute from "./features/conversation/conversation.route";

const app = new OpenAPIHono<Env>({
  defaultHook: zodValidationHook,
}).basePath("/api");

app.onError(globalExceptionHandler);
app.use(logger());

app.on(["POST", "GET"], "/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

app.doc("/doc", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "My-Agent API",
  },
});

app.get("/scalar", Scalar({ url: "/api/doc" }));

// Protected Routes
app.use(sessionMiddleware);

app.route("/conversations", conversationRoute);

export default app;
