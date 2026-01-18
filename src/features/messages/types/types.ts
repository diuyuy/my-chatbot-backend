import type z from "zod";
import type { DeleteMessageSchema } from "../schemas/schemas";

export type DeleteMessageDto = z.infer<typeof DeleteMessageSchema>;
