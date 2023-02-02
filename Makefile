VERSION = ${shell git describe --tags}
IMAGE = scs.buaa.edu.cn:8081/iobs/cloudview:$(VERSION)

.PHONY: all build image push

build:
	pnpm build

image:
	docker build -t $(IMAGE) -f ./Dockerfile .

push:
	docker push $(IMAGE)

all: image push
