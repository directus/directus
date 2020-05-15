# Query Complexity Analysis

This is a PHP port of [Query Complexity Analysis](http://sangria-graphql.org/learn/#query-complexity-analysis) in Sangria implementation.

Complexity analysis is a separate validation rule which calculates query complexity score before execution.
Every field in the query gets a default score 1 (including ObjectType nodes). Total complexity of the 
query is the sum of all field scores. For example, the complexity of introspection query is **109**.

If this score exceeds a threshold, a query is not executed and an error is returned instead.

Complexity analysis is disabled by default. To enabled it, add validation rule:

```php
<?php
use GraphQL\GraphQL;
use GraphQL\Validator\Rules\QueryComplexity;
use GraphQL\Validator\DocumentValidator;

$rule = new QueryComplexity($maxQueryComplexity = 100);
DocumentValidator::addRule($rule);

GraphQL::executeQuery(/*...*/);
```
This will set the rule globally. Alternatively, you can provide validation rules [per execution](executing-queries.md#custom-validation-rules).

To customize field score add **complexity** function to field definition:
```php
<?php
use GraphQL\Type\Definition\Type;
use GraphQL\Type\Definition\ObjectType;

$type = new ObjectType([
    'name' => 'MyType',
    'fields' => [
        'someList' => [
            'type' => Type::listOf(Type::string()),
            'args' => [
                'limit' => [
                    'type' => Type::int(),
                    'defaultValue' => 10
                ]
            ],
            'complexity' => function($childrenComplexity, $args) {
                return $childrenComplexity * $args['limit'];
            }
        ]
    ]
]);
```

# Limiting Query Depth

This is a PHP port of [Limiting Query Depth](http://sangria-graphql.org/learn/#limiting-query-depth) in Sangria implementation.
For example, max depth of the introspection query is **7**.

It is disabled by default. To enable it, add following validation rule:

```php
<?php
use GraphQL\GraphQL;
use GraphQL\Validator\Rules\QueryDepth;
use GraphQL\Validator\DocumentValidator;

$rule = new QueryDepth($maxDepth = 10);
DocumentValidator::addRule($rule);

GraphQL::executeQuery(/*...*/);
```

This will set the rule globally. Alternatively, you can provide validation rules [per execution](executing-queries.md#custom-validation-rules).

# Disabling Introspection
[Introspection](http://graphql.org/learn/introspection/) is a mechanism for fetching schema structure.
It is used by tools like GraphiQL for auto-completion, query validation, etc.

Introspection is enabled by default. It means that anybody can get a full description of your schema by 
sending a special query containing meta fields **__type** and **__schema** .

If you are not planning to expose your API to the general public, it makes sense to disable this feature.

GraphQL PHP provides you separate validation rule which prohibits queries that contain 
**__type** or **__schema** fields. To disable introspection, add following rule:

```php
<?php
use GraphQL\GraphQL;
use GraphQL\Validator\Rules\DisableIntrospection;
use GraphQL\Validator\DocumentValidator;

DocumentValidator::addRule(new DisableIntrospection());

GraphQL::executeQuery(/*...*/);
```
This will set the rule globally. Alternatively, you can provide validation rules [per execution](executing-queries.md#custom-validation-rules).
