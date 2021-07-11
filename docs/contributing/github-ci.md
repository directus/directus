# GitHub CI

> This guide explains how to publish a forked version of Directus on NPM, dockerhub and GHCR. You need to first
> [create a fork](/contributing/running-locally/)

::: tip Minimum Requirements

If you want to publish your fork to hub.docker.com or NPM you need to have an account there.

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
| `DOCKERHUB_TOKEN`    | Dockerhub Password                                      | `hunter2`      |

## 2. Create a release

```bash
npm run release
```
