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

For local use, you'll need a [GitHub personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) with `read:user` and `repo:status` permissions.

### GitHub CI

When running `pnpm changeset version` in the GitHub CI context, this package will automatically set the following outputs:
- `DIRECTUS_MAIN_VERSION`
- `DIRECTUS_RELEASE_NOTES`
