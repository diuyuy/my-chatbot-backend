# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Running the Application
```bash
bun run dev          # Start development server with hot reload (http://localhost:3000)
```

### Testing
```bash
bun test             # Run tests with vitest
bun test:coverage    # Run tests with coverage report
```

### Linting
```bash
bun run eslint .     # Run ESLint (uses @hono/eslint-config)
```

### Database Management
```bash
bunx drizzle-kit generate  # Generate migration files
bunx drizzle-kit migrate   # Apply migrations
bunx drizzle-kit studio    # Open Drizzle Studio for database inspection
```

## Architecture Overview

### Stack
- **Runtime**: Bun
- **Framework**: Hono with OpenAPI integration (@hono/zod-openapi)
- **Database**: PostgreSQL with Drizzle ORM and pgvector extension
- **Auth**: better-auth with Google OAuth
- **AI/LLM**: Vercel AI SDK with OpenAI and Google providers
- **Validation**: Zod schemas with OpenAPI documentation
- **Testing**: Vitest

### Project Structure

```
src/
├── common/               # Shared utilities and infrastructure
│   ├── constants/       # Enums and constants (model providers, languages, response statuses)
│   ├── db/              # Database configuration and schemas
│   │   └── schema/      # Drizzle table definitions (auth, conversations, messages, documents)
│   ├── error/           # Error handling (CommonHttpException, global handler)
│   ├── middlewares/     # Middleware (session validation)
│   ├── schemas/         # Common Zod schemas for API validation
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions (cursor pagination, response builders, Tavily search)
└── features/            # Feature modules
    ├── ai/              # AI service with streaming and embeddings
    ├── auth/            # better-auth configuration
    ├── conversation/    # Conversation management service
    ├── messages/        # Message handling (empty placeholder)
    └── rag/             # RAG functionality (empty placeholder)
```

### Key Architectural Patterns

**OpenAPI-First Design**: All routes are defined using `@hono/zod-openapi` with Zod schemas for request/response validation. The API documentation is available at `/api/scalar` and the OpenAPI spec at `/api/doc`.

**Authentication Flow**:
1. All `/auth/*` routes are handled by better-auth before middleware
2. After authentication, `sessionMiddleware` validates sessions and attaches user/session to context
3. Protected routes have access to `c.get('user')` and `c.get('session')`

**Database Architecture**:
- Uses Drizzle ORM with PostgreSQL
- Connection configured in `src/common/db/db.ts` with SSL enabled
- Schema split across files: `auth-schema.ts` (better-auth tables) and `schema.ts` (app tables)
- Vector embeddings stored in `document_chunks` table using pgvector (1536 dimensions)
- Trigram indexes on conversation titles for fuzzy search
- HNSW index on embeddings for similarity search

**AI/LLM Integration**:
- `ai.service.ts` handles all AI operations
- Supports multiple providers (OpenAI, Google) via unified interface
- Streaming responses using `streamText().toUIMessageStreamResponse()`
- Custom message ID generation with "msg" prefix
- Embedding generation using OpenAI's text-embedding-3-small
- Text chunking with LangChain's RecursiveCharacterTextSplitter (1000 chunk size, 100 overlap)
- Language-specific splitting support for code and documents

**Error Handling**:
- Custom `CommonHttpException` extends HTTPException
- Global error handler in `index.ts` catches all errors
- Standardized error responses with `success`, `code`, and `message` fields
- Response status constants defined in `RESPONSE_STATUS`

**Cursor-Based Pagination**: The codebase uses cursor pagination utilities in `cursor-utils.ts` for efficient data fetching.

### Environment Variables

Required in `.env`:
- `DATABASE_URL`: PostgreSQL connection string
- `BETTER_AUTH_SECRET`: Secret for better-auth sessions
- `BETTER_AUTH_URL`: Base URL for auth callbacks
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret

### Database Schema Notes

- `conversations`: User's chat conversations with trigram search on title
- `messages`: Individual messages with JSONB parts and metadata
- `document_resources`: Uploaded documents for RAG
- `document_chunks`: Text chunks with embeddings for semantic search
- All user data has cascade delete on user removal

### Common Patterns

**Creating API Routes**:
1. Define Zod schemas for request/response
2. Use `app.openapi()` with route definition
3. Return responses using `createSuccessResponse()` from response-utils
4. Handle errors by throwing `CommonHttpException`

**Database Queries**:
- Import `db` from `src/common/db/db.ts`
- Use Drizzle's query builder with typed schemas
- Always validate user access before modifying resources
