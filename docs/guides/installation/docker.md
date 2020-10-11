# Installing with Docker

```bash
docker run -p 8055:8055 directus/directus
```

## Installing Specific Versions

```bash
docker run -p 8055:8055 directus/directus:v9
docker run -p 8055:8055 directus/directus:v9.1
docker run -p 8055:8055 directus/directus:v9.1.2
```

## Setting Environment Variables

```bash
docker run -e ENV_VAR=VALUE -p 8055:8055 directus/directus
```
