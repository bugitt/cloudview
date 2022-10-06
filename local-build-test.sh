#! /bin/bash
pnpm build
docker build -t cloudview:test -f Dockerfile .
docker run --rm -p 8888:80 cloudview:test
