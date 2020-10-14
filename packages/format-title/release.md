# Release

Before making a new release, be sure that the project passes linting and the tests, otherwise it won't be published to NPM.

First, we will bump the package version number, commit the change and finally tag the commit with our new version. This is done with the help of the NPM version command (see `npm help version`).
```sh
npm run release [<newversion> | major | minor | patch]
```

Push the release commit and then the release tag to the Github repository:
```sh
git push && git push --tags
```

Github will take care of building the project, running all the tests, and finally publishing the package to the NPM registry.
