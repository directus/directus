bundle:
	npm run build
	git clone git@github.com:directus/app-next.git tmp-app
	cd tmp-app && npm install && npm run build
	cp -r tmp-app/dist dist/admin
	rm -rf tmp-app
