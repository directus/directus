# `@directus/release-notes-generator`

A release notes generator for [`changesets`](https://github.com/changesets/changesets) used by Directus

## Installation

```shell
npm install @directus/release-notes-generator
```

## Usage

Update the `.changeset/config.json` file to point to this package:

```json
	"changelog": "@directus/release-notes-generator",
```

The release notes will be generated and printed when running the `changesets` command to update the versions:

```shell
GITHUB_TOKEN=<token> pnpm changeset version
```
