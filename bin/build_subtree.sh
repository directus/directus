git subsplit init git@github.com:directus/directus.git
git subsplit publish --heads="master" --no-tags --debug api/core/Directus/Db:git@github.com:directus/directus-database.git

rm -rf .subsplit
