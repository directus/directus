# Hello world
Clean and simple single-file example of main GraphQL concepts originally proposed and 
implemented by [Leo Cavalcante](https://github.com/leocavalcante)

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
