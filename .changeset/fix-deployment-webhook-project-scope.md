---
'@directus/api': major
---

Fixed deployment webhooks resolving a project from the wrong provider when external IDs collide

::: notice

The `DeploymentProjectsService.readByExternalId` method now takes the deployment ID as its first argument (i.e. `readByExternalId(deploymentId, externalId)`)

:::
