#!/usr/bin/env bash

echo "Enable extension"
echo "extension = memcached.so" >> ~/.phpenv/versions/$(phpenv version-name)/etc/php.ini