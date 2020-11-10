# app-next

[![Coverage Status](https://coveralls.io/repos/github/directus/app-next/badge.svg?branch=master)](https://coveralls.io/github/directus/app-next?branch=master)


## Status: alpha

We're aiming to have the app codebase converted to TypeScript and fully unit test covered. This repo serves as a way for us to work on the bigger more foundational parts of the app codebase, without interferance of the legacy parts.

New components introduced in this repo will land in the current codebase where applicable. Bugfixes will continue to happen on the current codebase, until this version is fully done and merged.

**This version is in no way shape or form intended to be used in production environments.**

Once this codebase is complete enough to be used as main front-end, it will be moved to a branch on the main directus/app repo at which point it will be released as an beta / RC until confirmed ready.

## Goals

* Have everything in TypeScript
* Have full test coverage
* Have as much of the components in Storybook as possible
* Rely on global state the least amount possible

## Contributing

If you want to help out in the new version, please open an issue to discuss what you would like to do _before_ opening a pull request. This makes sure we don't do overlapping work or work on something that's not intended to be in the app.

## Development

You need Node.js v10+

After cloning the repo, run:

```
$ npm install # install all dependencies of the project
```

### Scripts

#### `npm run serve`

Bundles the app in dev mode and watches for changes.

Combine this with the `API_URL` environment variable to point it to a running API instance to debug fully:

```
$ API_URL=https://local.api.com npm serve
```

#### `npm run storybook`

Fires up an instance of Storybook and watches for changes. Very useful to develop individual components in isolation.
