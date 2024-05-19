FROM node:18-bullseye

RUN apt update && apt install curl wget vim -y && npm install -g pnpm

WORKDIR /app

ENV NODE_ENV production

COPY . .

RUN npm config set registry https://registry.npmmirror.com && \
    pnpm install --reporter ndjson && \
    pnpm build

EXPOSE 3000

ENV PORT 3000

CMD ["pnpm", "start"]
