FROM node:16-bullseye

RUN apt update && apt install curl wget vim -y && npm install -g pnpm

WORKDIR /app

ENV NODE_ENV production

COPY . .

RUN pnpm install && \
    pnpm build

EXPOSE 3000

ENV PORT 3000

CMD ["pnpm", "start"]