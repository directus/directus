# Server Health

The `/server/health` endpoint shows you a general health status for the server, and all connected (third party)
services, like Redis or S3.

The output is based on the "Health Check Response for HTTP APIs" draft spec:
https://tools.ietf.org/id/draft-inadarei-api-health-check-05.html

By default, the endpoint only returns a `status` of `ok`, `warn` or `error`. By authenticating as an admin, it'll return
more in-depth information about what the current health status of the system is.
