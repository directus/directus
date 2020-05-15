# Built-in directives
The directive is a way for a client to give GraphQL server additional context and hints on how to execute
the query. The directive can be attached to a field or fragment and can affect the execution of the 
query in any way the server desires.

GraphQL specification includes two built-in directives:
 
* **@include(if: Boolean)** Only include this field or fragment in the result if the argument is **true** 
* **@skip(if: Boolean)** Skip this field or fragment if the argument is **true**

For example:
```graphql
query Hero($episode: Episode, $withFriends: Boolean!) {
  hero(episode: $episode) {
    name
    friends @include(if: $withFriends) {
      name
    }
  }
}
```
Here if **$withFriends** variable is set to **false** - friends section will be ignored and excluded 
from the response. Important implementation detail: those fields will never be executed 
(not just removed from response after execution).

# Custom directives
**graphql-php** supports custom directives even though their presence does not affect the execution of fields.
But you can use [`GraphQL\Type\Definition\ResolveInfo`](../reference.md#graphqltypedefinitionresolveinfo) 
in field resolvers to modify the output depending on those directives or perform statistics collection.
 
Other use case is your own query validation rules relying on custom directives.

In **graphql-php** custom directive is an instance of `GraphQL\Type\Definition\Directive`
(or one of its subclasses) which accepts an array of following options:

```php
<?php
use GraphQL\Language\DirectiveLocation;
use GraphQL\Type\Definition\Type;
use GraphQL\Type\Definition\Directive;
use GraphQL\Type\Definition\FieldArgument;

$trackDirective = new Directive([
    'name' => 'track',
    'description' => 'Instruction to record usage of the field by client',
    'locations' => [
        DirectiveLocation::FIELD,
    ],
    'args' => [
        new FieldArgument([
            'name' => 'details',
            'type' => Type::string(),
            'description' => 'String with additional details of field usage scenario',
            'defaultValue' => ''
        ])
    ]
]);
```

See possible directive locations in 
[`GraphQL\Language\DirectiveLocation`](../reference.md#graphqllanguagedirectivelocation).
