#! /bin/bash
pnpm build
docker build -t cloudview:test -f Dockerfile .
docker run --rm -p 5173:80 cloudview:test
