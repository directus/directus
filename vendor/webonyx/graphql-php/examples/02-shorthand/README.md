# Parsing GraphQL IDL shorthand

Same as the Hello world example but shows how to build GraphQL schema from shorthand 
and wire up some resolvers

### Run locally
```
php -S localhost:8080 ./graphql.php
```

### Try query
```
curl http://localhost:8080 -d '{"query": "query { echo(message: \"Hello World\") }" }'
```

### Try mutation
```
curl http://localhost:8080 -d '{"query": "mutation { sum(x: 2, y: 2) }" }'
```
