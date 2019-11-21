#!/usr/bin/env bash

echo "Install memcache(d)"
echo "extension = memcached.so" >> ~/.phpenv/versions/$(phpenv version-name)/etc/php.ini
