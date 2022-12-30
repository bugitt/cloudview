#! /bin/bash
docker build -t cloudview:test -f Dockerfile .
docker run --rm -p 5173:3000 cloudview:test
