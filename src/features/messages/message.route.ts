import { OpenAPIHono } from "@hono/zod-openapi";
import type { Env } from "../../common/types/types";

const messageRoute = new OpenAPIHono<Env>();

export default messageRoute;
