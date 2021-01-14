SHELL=bash

version=latest
tag=$(version)
cmd=
user=directus
registry=docker.io
repository=directus/directus

.PHONY: build

build-images:
	docker build \
		--build-arg VERSION=$(version) \
		--build-arg REPOSITORY=$(repository) \
		-t directus:temp \
		-f ./build-images/rootfs/directus/images/main/Dockerfile \
		./build-images/rootfs/directus/images/main

	docker tag directus:temp $(registry)/$(repository):$(version)
	docker tag directus:temp $(registry)/$(repository):$(tag)
	docker image rm directus:temp

test-image:
	docker run --rm -it $(registry)/$(repository):$(tag) $(cmd)
