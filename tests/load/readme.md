This package contains load tests for the api server.

## Running the tests

To run the tests, you need to have a running api server and (k6)[https://github.com/grafana/k6] installed.

To run a test use the following command:

```
k6 run --vus 10 --duration 30s ./cache-test.js
```