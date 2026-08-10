# @directus/cli

Command-line tool for moving Directus schema and configuration between instances.

## Description

Sync schema and configuration (data models, roles, policies, permissions, flows, dashboards, settings, and more) between
Directus instances through JSON files you can commit to git. Pull a snapshot from a source instance, preview exactly
what would change on a target, then push. Move work from staging to production, keep environments in step, or review
every change to an instance in a pull request first.

For more information about Directus, visit the [official website](https://directus.com).

## Installation

```shell
npm install -g @directus/cli
```

This installs the `d6s` command (and `directus-cli` as a longer alias).

## Usage

```shell
d6s profile add staging          # name an instance URL and save a credential for it
d6s sync pull --from staging     # snapshot schema + configuration into committed files
d6s sync diff --to production    # read-only preview of exactly what a push would do
d6s sync push --to production    # apply the committed files to the target
d6s sync                         # interactive wizard: pull → push
```

Run `d6s --help` for the full command reference.

## Compatibility

Requires Directus 12.2.0 or later. The CLI is versioned independently of Directus, so you don't need matching version
numbers between the CLI and your instances.

## License

This package is licensed under the MIT License. See the
[LICENSE](https://github.com/directus/directus/blob/main/packages/cli/license) file for more information.
