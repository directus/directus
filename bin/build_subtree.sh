#!/bin/sh

git subsplit init git@github.com:directus/directus.git

# Collection
git subsplit publish --heads="version/6.4" --no-tags --debug api/core/Directus/Collection:git@github.com:directus/directus-collection.git

# Config
git subsplit publish --heads="version/6.4" --no-tags --debug api/core/Directus/Config:git@github.com:directus/directus-config.git

# Permissions
git subsplit publish --heads="version/6.4" --no-tags --debug api/core/Directus/Permissions:git@github.com:directus/directus-permissions.git

# Database
git subsplit publish --heads="version/6.4" --no-tags --debug api/core/Directus/Database:git@github.com:directus/directus-database.git

# Filesystem
git subsplit publish --heads="version/6.4" --no-tags --debug api/core/Directus/Filesystem:git@github.com:directus/directus-filesystem.git

# Hash
git subsplit publish --heads="version/6.4" --no-tags --debug api/core/Directus/Hash:git@github.com:directus/directus-hash.git

# Hooks
git subsplit publish --heads="version/6.4" --no-tags --debug api/core/Directus/Hook:git@github.com:directus/directus-hook.git

# Utils
git subsplit publish --heads="version/6.4" --no-tags --debug api/core/Directus/Util:git@github.com:directus/directus-php-utils.git

rm -rf .subsplit
