#!/usr/bin/env bash

echo "Add php.ini settings"
phpenv config-add ./build/php/memcache.ini

echo "Enable extension"
echo "extension = memcache.so" >> ~/.phpenv/versions/$(phpenv version-name)/etc/php.ini