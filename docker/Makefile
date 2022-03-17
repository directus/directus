SHELL=bash

version=$(shell git describe --tags --abbrev=0)
tag=latest
cmd=
user=directus
registry=gcr.io
repository=uncoil-io/directus
tmp_package_json=$(mktemp)

.PHONY: build-images

build-images:
	npm run build
	npm run pack
	jq 'del( .dependencies ["sqlite3", "tedious", "mysql", "memcached", "connect-memcached", "keyv-memcache", "nodemailer-mailgun-transport"] )' ../dist/package.json > "$tmp_package_json" && mv "$tmp_package_json" ../dist/package.json
	docker buildx build --platform linux/amd64 \
		--build-arg VERSION=$(version) \
		--build-arg REPOSITORY=$(repository) \
		--load \
		-t directus:temp \
		-f ./Dockerfile \
		..

	docker tag directus:temp $(registry)/$(repository):$(version)
	docker tag directus:temp $(registry)/$(repository):$(tag)
	docker image rm directus:temp

test-image:
	docker run --rm -it $(registry)/$(repository):$(tag) $(cmd)
