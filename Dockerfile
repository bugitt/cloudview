FROM node:16-alpine

RUN apk add --no-cache libc6-compat && npm install -g pnpm

WORKDIR /app

ENV NODE_ENV production

COPY . .

RUN pnpm install && \
    pnpm build

EXPOSE 3000

ENV PORT 3000

CMD ["pnpm", "start"]