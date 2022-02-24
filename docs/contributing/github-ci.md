# GitHub CI

> This guide explains how to publish a forked version of Directus on NPM, Dockerhub and GHCR. You need to first
> [create a fork](/contributing/running-locally/)

::: warning Using a fork in production is neither supported nor recommended.

Only do so if:

1. The feature you want to implement doesn't satisfy the 80/20 principle
2. There is a technical limitation preventing you from implementing it as an extension

Forks are not officially supported - please don't submit fork-specific bugs and questions on the official repo.

If you suspect a bug to not be part of your changes please confirm this by reproducing it with the official version
**before** submitting an issue.

:::

::: tip Minimum Requirements

If you want to publish your fork to hub.docker.com or NPM you need to have an account there.

Note: to publish to NPM you probably have to change all the package names. Publishing to NPM should almost never be
necessary.

:::

## 1. Setup environment variables/secrets

## General

| Variable          | Description                                                            | Example                     |
| ----------------- | ---------------------------------------------------------------------- | --------------------------- |
| `GHCR_IMAGE`      | Image name for GitHub Container Registry. Be sure to use the full URL. | `ghcr.io/directus/directus` |
| `DOCKERHUB_IMAGE` | Image name for hub.docker.com, no prefix.                              | `directus/directus`         |

| Secret               | Description                                             | Example        |
| -------------------- | ------------------------------------------------------- | -------------- |
| `NPM_TOKEN`          | Your NPM token. Make sure to use the type "automation". | `12345678-...` |
| `DOCKERHUB_USERNAME` | Dockerhub Username                                      | `directus`     |
| `DOCKERHUB_PASSWORD` | Dockerhub Password                                      | `hunter2`      |

## 2. Create a release

```bash
npm run release
```
