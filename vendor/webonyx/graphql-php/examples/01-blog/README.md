## Blog Example
Simple yet full-featured example of GraphQL API. Models blogging platform with Stories, Users
and hierarchical comments. 

### Run locally
```
php -S localhost:8080 ./graphql.php
```

### Test if GraphQL is running
If you open `http://localhost:8080` in browser you should see `json` response with 
following message:
```
{
  data: {
    hello: "Your GraphQL endpoint is ready! Install GraphiQL to browse API"
  }
}
```

Note that some browsers may try to download JSON file instead of showing you the response.
In this case try to install browser plugin that adds JSON support (like JSONView or similar)

### Debugging Mode
By default GraphQL endpoint exposed at `http://localhost:8080` runs in production mode without 
additional debugging tools enabled.

In order to enable debugging mode with additional validation, error handling and reporting - 
use `http://localhost:8080?debug=1` as endpoint

### Browsing API
The most convenient way to browse GraphQL API is by using [GraphiQL](https://github.com/graphql/graphiql)
But setting it up from scratch may be inconvenient. An easy alternative is to use one of 
the existing Google Chrome extensions:
- [ChromeiQL](https://chrome.google.com/webstore/detail/chromeiql/fkkiamalmpiidkljmicmjfbieiclmeij)
- [GraphiQL Feen](https://chrome.google.com/webstore/detail/graphiql-feen/mcbfdonlkfpbfdpimkjilhdneikhfklp)

Set `http://localhost:8080?debug=1` as your GraphQL endpoint/server in one of these extensions 
and try clicking "Docs" button (usually in the top-right corner) to browse auto-generated 
documentation.

### Running GraphQL queries
Copy following query to GraphiQL and execute (by clicking play button on top bar)

```
{
  viewer {
    id
    email
  }
  user(id: "2") {
    id
    email
  }
  stories(after: "1") {
    id
    body
    comments {
      ...CommentView
    }
  }
  lastStoryPosted {
    id
    hasViewerLiked
   
    author {
      id
      photo(size: ICON) {
        id
        url
        type
        size
        width
        height
        # Uncomment following line to see validation error:
        # nonExistingField
        
        # Uncomment to see error reporting for fields with exceptions thrown in resolvers
        # fieldWithError
        # nonNullFieldWithError
      }
      lastStoryPosted {
        id
      }
    }
    body(format: HTML, maxLength: 10)
  }
}

fragment CommentView on Comment {
  id
  body
  totalReplyCount
  replies {
    id
    body
  }
}
```

### Run your own query
Use GraphiQL autocomplete (via CTRL+space) to easily create your own query.

Note: GraphQL query requires at least one field per object type (to prevent accidental overfetching).
For example following query is invalid in GraphQL:

```
{
    viewer
}
```

Try copying this query and see what happens

### Run mutation query
TODOC

### Dig into source code
Now when you tried GraphQL API as a consumer, see how it is implemented by browsing
source code.
