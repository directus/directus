# For testing purposes only!

SHELL=bash

image=directus-test
version=$(shell git rev-parse HEAD)
tag=latest

.PHONY: build-image test-image

build-image:
	pnpm install
	pnpm -r build
	node pack.js
	docker build \
		--build-arg VERSION=$(version) \
		--build-arg REPOSITORY=$(image) \
		-t $(image):$(version) \
		-f ./Dockerfile \
		..
	docker tag $(image):$(version) $(image):$(tag)

# To override or pass additional arguments:
# DOCKER_ARGS='-p 8051:8055 -e LOG_STYLE=raw' make test-image
test-image:
	ARGS=($$DOCKER_ARGS); docker run \
		--rm \
		-t \
		-p 8055:8055 \
		-e "KEY=$$(uuidgen | tr '[:upper:]' '[:lower:]')" \
		-e "SECRET=$$(uuidgen | tr '[:upper:]' '[:lower:]')" \
		"$${ARGS[@]}" \
		$(image):$(tag)

enter-image:
	ARGS=($$DOCKER_ARGS); docker run \
		--rm \
		-it \
		"$${ARGS[@]}" \
		$(image):$(tag) \
		/bin/sh
