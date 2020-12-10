# Error Codes

> TK

| Error Code            | Description                                    |
| --------------------- | ---------------------------------------------- |
| `FAILED_VALIDATION`   | Validation for this particular item failed     |
| `FORBIDDEN`           | You are not allowed to do the current action   |
| `INVALID_CREDENTIALS` | Username / password or access token is wrong   |
| `INVALID_OTP`         | Wrong OTP was provided                         |
| `INVALID_PAYLOAD`     | Provided payload is invalid                    |
| `INVALID_QUERY`       | The requested query parameters can not be used |
| `REQUESTS_EXCEEDED`   | Hit rate limit; Too many requests              |
| `ROUTE_NOT_FOUND`     | Endpoint does not exist                        |
| `SERVICE_UNAVAILABLE` | Could not use external service                 |

<!-- prettier-ignore-start -->
::: warning Security
To prevent leaking which items exist, all actions for non-existing items will
return a `FORBIDDEN` error.
:::
<!-- prettier-ignore-end -->
