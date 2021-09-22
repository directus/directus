# Error Codes

> Below is a listing of global error codes used within Directus, and what they mean.

| Error Code             | HTTP Status | Description                                                  |
| ---------------------- | ----------- | ------------------------------------------------------------ |
| `FAILED_VALIDATION`    | 400         | Validation for this particular item failed                   |
| `FORBIDDEN`            | 403         | You are not allowed to do the current action                 |
| `INVALID_CREDENTIALS`  | 401         | Username / password or access token is wrong                 |
| `INVALID_IP`           | 401         | Your IP address isn't allow-listed to be used with this user |
| `INVALID_OTP`          | 401         | Wrong OTP was provided                                       |
| `INVALID_PAYLOAD`      | 400         | Provided payload is invalid                                  |
| `INVALID_QUERY`        | 400         | The requested query parameters can not be used               |
| `REQUESTS_EXCEEDED`    | 429         | Hit the rate limit                                           |
| `ROUTE_NOT_FOUND`      | 404         | Endpoint does not exist                                      |
| `SERVICE_UNAVAILABLE`  | 503         | Could not use external service                               |
| `UNPROCESSABLE_ENTITY` | 422         | You tried doing something illegal                            |

::: warning Security

To prevent leaking which items exist, all actions for non-existing items will return a `FORBIDDEN` error.

:::
