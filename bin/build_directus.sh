git clone https://github.com/directus/directus.git .directus-build
npm install
gulp build
gulp deploy
rm -rf .directus-build/
