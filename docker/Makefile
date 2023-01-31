# For testing purposes only!

SHELL=bash

IMAGE=directus-test
VERSION=$(shell git rev-parse HEAD)
TAG=latest
# Currently it's only possible to target a single platform locally in one run
PLATFORM?=linux/amd64

all : prepare build-image
.PHONY: all prepare build-image test-image

prepare:
	pnpm install
	pnpm -r build
	node pack.js

build-image:
	docker buildx create --use
	docker buildx build \
		--build-arg VERSION=$(VERSION) \
		--build-arg REPOSITORY=$(IMAGE) \
		--build-arg LIBVIPS_VERSION=$$(node get-libvips-version.js) \
		--platform $(PLATFORM) \
		--tag $(IMAGE):$(VERSION) \
		--tag $(IMAGE):$(TAG) \
		--output type=docker \
	  --file Dockerfile \
		..
	docker buildx rm

# To override or set additional arguments:
# DOCKER_ARGS='-p 8051:8055 -e LOG_STYLE=raw' make test-image
test-image:
	ARGS=($$DOCKER_ARGS); docker run \
		--platform $(PLATFORM) \
		--rm \
		--tty \
		--publish 8055:8055 \
		--env "KEY=$$(uuidgen | tr '[:upper:]' '[:lower:]')" \
		--env "SECRET=$$(uuidgen | tr '[:upper:]' '[:lower:]')" \
		"$${ARGS[@]}" \
		$(IMAGE):$(TAG)

enter-image:
	ARGS=($$DOCKER_ARGS); docker run \
		--platform $(PLATFORM) \
		--rm \
		--interactive \
		--tty \
		"$${ARGS[@]}" \
		$(IMAGE):$(TAG) \
		/bin/sh
