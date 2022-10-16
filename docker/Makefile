SHELL=bash

version=$(shell git describe --tags --abbrev=0)
tag=latest
cmd=
user=ciso360ai
registry=docker.io
repository=ciso360ai/directus

.PHONY: build-images

build-images:
	npm run build
	npm run pack
	docker build \
		--build-arg VERSION=$(version) \
		--build-arg REPOSITORY=$(repository) \
		-t directus:temp \
		-f ./Dockerfile \
		..

	docker tag directus:temp $(registry)/$(repository):$(version)
	docker tag directus:temp $(registry)/$(repository):$(tag)
	docker image rm directus:temp

test-image:
	docker run --rm -it $(registry)/$(repository):$(tag) $(cmd)
