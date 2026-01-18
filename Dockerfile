# check=skip=FromAsCasing

FROM oven/bun:latest as base


FROM base as builder

WORKDIR /app

COPY package.json ./

COPY bun.lock ./

COPY src ./src

RUN bun install --frozen-lockfile --production


FROM base AS production

WORKDIR /app

# non-root 사용자 생성 (Debian 방식)
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs bunuser

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD [ "bun", "run", "src/index.ts" ]