git subsplit init git@github.com:directus/directus.git

# ACL
git subsplit publish --heads="development" --no-tags --debug api/core/Directus/Acl:git@github.com:directus/directus-acl.git

# Database
git subsplit publish --heads="development" --no-tags --debug api/core/Directus/Db:git@github.com:directus/directus-database.git

# Hooks
git subsplit publish --heads="development" --no-tags --debug api/core/Directus/Hook:git@github.com:directus/directus-hook.git

# Utils
git subsplit publish --heads="development" --no-tags --debug api/core/Directus/Util:git@github.com:directus/directus-php-utils.git

rm -rf .subsplit
