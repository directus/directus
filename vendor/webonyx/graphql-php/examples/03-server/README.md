# Hello world
Same example as 01-hello-world, but uses 
[Standard Http Server](http://webonyx.github.io/graphql-php/executing-queries/#using-server)
instead of manual parsing of incoming data.

### Run locally
```
php -S localhost:8080 ./graphql.php
```

### Try query
```
curl -d '{"query": "query { echo(message: \"Hello World\") }" }' -H "Content-Type: application/json" http://localhost:8080
```

### Try mutation
```
curl -d '{"query": "mutation { sum(x: 2, y: 2) }" }' -H "Content-Type: application/json" http://localhost:8080
```
