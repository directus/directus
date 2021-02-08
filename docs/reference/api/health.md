# Server Health

> The `/server/health` endpoint shows you a general health status for the server and all connected (third party) services, such as Redis or S3.

The output is based on the "Health Check Response for HTTP APIs" draft spec:
[Health Check Response Format for HTTP APIs Draft Specification](https://tools.ietf.org/id/draft-inadarei-api-health-check-05.html).

This endpoint can be used to ensure a healthy system when running in a horizontally scaled setup, like Kubernetes or AWS
Elastic Beanstalk.

By default, the endpoint only returns a `status` of `ok`, `warn` or `error`. By authenticating as an admin, it will return
more in-depth information about the current health status of the system.

```json
// Response

// Non-admin
{
  "status": "ok"
}

// Admin
{
  "status": "ok",
  "releaseId": "9.0.0",
  "serviceId": "3292c816-ae02-43b4-ba91-f0bb549f040c",
  "checks": {
    "pg:responseTime": [
      {
        "status": "ok",
        "componentType": "datastore",
        "observedUnit": "ms",
        "observedValue": 0.489
      }
    ],
    "pg:connectionsAvailable": [
      {
        "status": "ok",
        "componentType": "datastore",
        "observedValue": 2
      }
    ],
    "pg:connectionsUsed": [
      {
        "status": "ok",
        "componentType": "datastore",
        "observedValue": 0
      }
    ],
    "storage:local:responseTime": [
      {
        "status": "ok",
        "componentType": "objectstore",
        "observedValue": 1.038,
        "observedUnit": "ms"
      }
    ],
    "email:connection": [
      {
        "status": "ok",
        "componentType": "email"
      }
    ]
  }
}
```
