export const RESPONSE_STATUS = {
  OK: {
    status: 200,
    code: "OK",
    message: "요청이 성공적으로 처리되었습니다.",
    description: "요청 성공",
  },

  CONVERSATION_CREATED: {
    status: 201,
    code: "CONVERSATION_CREATED",
    message: "Conversation이 성공적으로 생성되었습니다.",
    description: "요청 성공",
  },

  EMBEDDING_CREATED: {
    status: 201,
    code: "EMBEDDING_CREATED",
    message: "임베딩이 성공적으로 생성되었습니다.",
    description: "요청 성공",
  },

  // 400
  INVALID_REQUEST_FORMAT: {
    status: 400,
    code: "INVALID_REQUEST_FORMAT",
    message: "유효하지 않은 요청 형식입니다.",
    description: "유효하지 않은 요청 형식",
  },

  // 401
  INVALID_SESSION: {
    status: 401,
    code: "INVALID_SESSION",
    message: "유효하지 않은 세션입니다.",
    description: "유효하지 않은 세션",
  },

  INVALID_API_KEY: {
    status: 401,
    code: "INVALID_API_KEY",
    message: "유효하지 않은 API 키입니다.",
    description: "유효하지 않은 API KEY",
  },

  // 403
  ACCESS_CONVERSATION_DENIED: {
    status: 403,
    code: "ACCESS_CONVERSATION_DENIED",
    message: "해당 대화에 접근할 권한이 없습니다.",
    description: "권한 오류",
  },

  ACCESS_MESSAGE_DENIED: {
    status: 403,
    code: "ACCESS_MESSAGE_DENIED",
    message: "해당 메시지에 접근할 권한이 없습니다.",
    description: "권한 오류",
  },

  ACCESS_RESOURCE_DENIED: {
    status: 403,
    code: "ACCESS_RESOURCE_DENIED",
    message: "해당 리소스에 접근할 권한이 없습니다.",
    description: "권한 오류",
  },

  ACCESS_CHUNK_DENIED: {
    status: 403,
    code: "ACCESS_CHUNK_DENIED",
    message: "해당 Chunk에 접근할 권한이 없습니다.",
    description: "권한 오류",
  },

  // 404
  NOT_FOUND: {
    status: 404,
    code: "NOT_FOUND",
    message: "해당 자원이 존재하지 않습니다.",
    description: "Not Found",
  },

  CONVERSATION_NOT_FOUND: {
    status: 404,
    code: "CONVERSATION_NOT_FOUND",
    message: "해당 대화가 존재하지 않습니다.",
    description: "Not Found Conversation",
  },

  MESSAGE_NOT_FOUND: {
    status: 404,
    code: "MESSAGE_NOT_FOUND",
    message: "해당 메시지가 존재하지 않습니다.",
    description: "Not Found Conversation",
  },

  RESOURCE_NOT_FOUND: {
    status: 404,
    code: "RESOURCE_NOT_FOUND",
    message: "해당 리소스가 존재하지 않습니다.",
    description: "Not Found Conversation",
  },

  CHUNK_NOT_FOUND: {
    status: 404,
    code: "CHUNCK_NOT_FOUND",
    message: "해당 Chunk가 존재하지 않습니다.",
    description: "Not Found Conversation",
  },

  // 500
  INTERNAL_SERVER_ERROR: {
    status: 500,
    code: "INTERNAL_SERVER_ERROR",
    message: "서버 내부에 오류가 발생했습니다.",
    description: "서버 내부 오류",
  },
} as const;
