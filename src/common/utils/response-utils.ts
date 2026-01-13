import { ErrorResponseSchema } from "../schemas/common.schema";
import type { PaginationOption, ResponseStatus } from "../types/types";

export const createSuccessResponse = <T>(
  { message }: ResponseStatus,
  data: T
) => {
  return {
    success: true,
    message,
    data,
  };
};

export const createPaginationResponse = <T>(
  items: T[],
  { nextCursor, totalElements, hasNext }: PaginationOption
) => {
  return {
    items,
    nextCursor,
    totalElements,
    hasNext,
  };
};

export const createErrorResponseSignature = ({
  code,
  message,
  description,
}: ResponseStatus) => {
  return {
    content: {
      "application/json": {
        schema: ErrorResponseSchema,
        example: {
          success: false,
          code,
          message,
        },
      },
    },
    description,
  };
};
