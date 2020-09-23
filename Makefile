SHELL=bash

version=v9.0.0-beta.1
tag=$(version)
cmd=
user=directus

.PHONY: build

action:
	act release \
		--actor $(user) \
		--secret-file .secrets

build-image:
	docker build --build-arg VERSION=$(version) -t directus:temp -f ./containers/Dockerfile ./containers
	docker tag directus:temp ghcr.io/directus/directus:$(version)
	docker tag directus:temp ghcr.io/directus/directus:$(tag)
	docker image rm directus:temp

run-image:
	docker run --rm -it ghcr.io/directus/directus:$(tag) $(cmd)
