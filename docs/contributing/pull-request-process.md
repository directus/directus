# Pull Request Process

Pull Requests (PRs) are a fantastic way to contribute back to the project. It's one of the fastest ways to see a bug fix
or new feature you care about land in the platform.

Reviewing and maintaining community submitted code is a very time consuming process. To ensure the core team can give
every PR the tender love and care it deserves, and not let valuable PRs go stale, we require that:

**Every pull request must be in answer to an existing open [Issue](https://github.com/directus/directus/issues).**

We use [GitHub Issues](https://github.com/directus/directus/issues) as a living to-do list of tasks to work on next.
Each PR resolving a related issue ensures that it aligns with the core team's planning and long-term goals. Please leave
a comment on the issue related to your PR so you can be marked as the assignee. This ensures no one else will
accidentally work on the same issue at the same time.

## Choosing What to Implement

We welcome PRs for any open [Issue](https://github.com/directus/directus/issues). Issues labeled
["Good First Issue"](https://github.com/directus/directus/issues?q=is:issue+is:open+label:%22:star:+Good+First+Issue%22)
are typically easier to resolve for those who haven't contributed to the codebase before, and are therefore a great
starting point.

## Implementing an Accepted Feature Request

If you're looking to implement a feature request that hasn't been converted to an issue yet, please contact the core
team through a comment on the feature request before starting work. There's probably a good reason it isn't
ready-to-be-implemented yet (unknown timelines, conflicts with other projects, blockers, etc). By collaborating early,
we ensure your PR can be merged as efficiently as possible!

## Copyright License Agreement (CLA)

All code contributors are required to sign the Contributor License Agreement (CLA). When you start a pull request, a
GitHub Action will prompt you to review the CLA and sign it by adding your name to
[contributors.yml](https://github.com/directus/directus/blob/main/contributors.yml). To clarify the intellectual
property rights in the project and any Contributions, Directus requires that You accept the
[Contributor License Agreement](https://github.com/directus/directus/blob/main/cla.md). This license is for Your
protection as a contributor as well as the protection of Directus, recipients of software distributed or made available
by Directus, and other contributors; it does not change your rights to use your own Contributions for any other purpose.

## Changesets

To properly generate changelogs and determine the right version number after a change is merged, we rely on
[changesets](https://github.com/changesets/changesets). Each pull request should include a changeset that describes
whether the change is a patch/minor/major version bump, and describe what the change is. Changesets should be written in
past tense.

A changeset can be generated via the following command:

```shell
pnpm changeset
```

### Changeset Bump Definitions

The following are the types of version bumps that can be specified in a changeset:

- Major (x.0.0) - A change has been made that is incompatible with previous versions.
- Minor (0.x.0) - A feature has been added that is backwards compatible with previous versions.
- Patch (0.0.x) - A bug has been fixed that is backwards compatible with previous versions.
