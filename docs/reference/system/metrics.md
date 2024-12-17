---
description: REST and GraphQL API documentation on the Metric endpoint in Directus.
readTime: 4 min read
pageClass: page-reference
---

# Metrics

Retrieve the metrics for the instances connected services.

The output is based on prometheus "Time Series Data Model":
[Prometheus Time Series Data Model](https://prometheus.io/docs/concepts/data_model)

```text
# TYPE directus_cache_response_time histogram
directus_cache_response_time 0.552
# TYPE directus_sqlite3_response_time histogram
directus_sqlite3_response_time 1.009
# TYPE directus_local_response_time histogram
directus_local_response_time 12.394

```

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /metrics`

</template>
<template #graphql>

`POST /graphql/metrics`

</template>
<template #sdk>

```js
import { createDirectus, rest, readMetrics } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(readMetrics());
```

</template>
</SnippetToggler>
