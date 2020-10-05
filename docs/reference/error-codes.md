# Error Codes

| Error Code            | Description                                  |
|-----------------------|----------------------------------------------|
| `FAILED_VALIDATION`   | Validation for this particular item failed   |
| `FORBIDDEN`           | You aren't allowed to do the current action  |
| `INVALID_CREDENTIALS` | Username / password or access token is wrong |
| `INVALID_OTP`         | Wrong OTP was provided                       |
| `INVALID_PAYLOAD`     | Provided payload is invalid                  |
| `INVALID_QUERY`       | The requested query parameters can't be used |
| `REQUESTS_EXCEEDED`   | Hit rate limit. Too many requests            |
| `ROUTE_NOT_FOUND`     | Endpoint doesn't exist                       |
| `SERVICE_UNAVAILABLE` | Couldn't use external service                |

In order to prevent leaking what items exist, any action to a non-existing item will
return a FORBIDDEN error.
