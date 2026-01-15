import { OpenAPIHono } from "@hono/zod-openapi";
import type { Env } from "../../common/types/types";
import { registerRagPaths } from "./register-rag-path";

const ragRoute = new OpenAPIHono<Env>();

registerRagPaths(ragRoute);

export default ragRoute;
