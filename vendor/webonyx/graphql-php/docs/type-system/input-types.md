# Mutations
Mutation is just a field of a regular [Object Type](object-types.md) with arguments.
For GraphQL PHP runtime there is no difference between query fields with arguments and mutations.
They are executed [almost](http://facebook.github.io/graphql/#sec-Mutation) identically. 
To some extent, Mutation is just a convention described in the GraphQL spec.

Here is an example of a mutation operation:
```graphql
mutation CreateReviewForEpisode($ep: EpisodeInput!, $review: ReviewInput!) {
  createReview(episode: $ep, review: $review) {
    stars
    commentary
  }
}
```

To execute such a mutation, you need **Mutation** type [at the root of your schema](schema.md):

```php
<?php
use GraphQL\Type\Definition\Type;
use GraphQL\Type\Definition\ObjectType;

$myMutationType = new ObjectType([
    'name' => 'Mutation',
    'fields' => [
        // List of mutations:
        'createReview' => [
            'args' => [
                'episode' => Type::nonNull($episodeInputType),
                'review' => Type::nonNull($reviewInputType)
            ],
            'type' => new ObjectType([
                'name' => 'CreateReviewOutput',
                'fields' => [
                    'stars' => ['type' => Type::int()],
                    'commentary' => ['type' => Type::string()]
                ]
            ]),
        ],
        // ... other mutations
    ]
]);
```
As you can see, the only difference from regular object type is the semantics of field names
(verbs vs nouns).

Also as we see arguments can be of complex types. To leverage the full power of mutations 
(and field arguments in general) you must learn how to create complex input types.


# About Input and Output Types
All types in GraphQL are of two categories: **input** and **output**.

* **Output** types (or field types) are: [Scalar](scalar-types.md), [Enum](enum-types.md), [Object](object-types.md), 
[Interface](interfaces.md), [Union](unions.md)

* **Input** types (or argument types) are: [Scalar](scalar-types.md), [Enum](enum-types.md), InputObject

Obviously, [NonNull and List](lists-and-nonnulls.md) types belong to both categories depending on their 
inner type.

Until now all examples of field **arguments** in this documentation were of [Scalar](scalar-types.md) or 
[Enum](enum-types.md) types. But you can also pass complex objects. 

This is particularly valuable in case of mutations, where input data might be rather complex.

# Input Object Type
GraphQL specification defines Input Object Type for complex inputs. It is similar to ObjectType
except that it's fields have no **args** or **resolve** options and their **type** must be input type.

In graphql-php **Input Object Type** is an instance of `GraphQL\Type\Definition\InputObjectType` 
(or one of it subclasses) which accepts configuration array in constructor:

```php
<?php
use GraphQL\Type\Definition\Type;
use GraphQL\Type\Definition\InputObjectType;

$filters = new InputObjectType([
    'name' => 'StoryFiltersInput',
    'fields' => [
        'author' => [
            'type' => Type::id(),
            'description' => 'Only show stories with this author id'
        ],
        'popular' => [
            'type' => Type::boolean(),
            'description' => 'Only show popular stories (liked by several people)'
        ],
        'tags' => [
            'type' => Type::listOf(Type::string()),
            'description' => 'Only show stories which contain all of those tags'
        ]
    ]
]);
```

Every field may be of other InputObjectType (thus complex hierarchies of inputs are possible)

# Configuration options
The constructor of InputObjectType accepts array with only 3 options:
 
Option       | Type     | Notes
------------ | -------- | -----
name         | `string` | **Required.** Unique name of this object type within Schema
fields       | `array` or `callable` | **Required**. An array describing object fields or callable returning such an array (see below).
description  | `string` | Plain-text description of this type for clients (e.g. used by [GraphiQL](https://github.com/graphql/graphiql) for auto-generated documentation)

Every field is an array with following entries:

Option | Type | Notes
------ | ---- | -----
name | `string` | **Required.** Name of the input field. When not set - inferred from **fields** array key
type | `Type` | **Required.** Instance of one of [Input Types](input-types.md) (**Scalar**, **Enum**, **InputObjectType** + any combination of those with **nonNull** and **listOf** modifiers)
description | `string` | Plain-text description of this input field for clients (e.g. used by [GraphiQL](https://github.com/graphql/graphiql) for auto-generated documentation)
defaultValue | `scalar` | Default value of this input field. Use the internal value if specifying a default for an **enum** type

# Using Input Object Type
In the example above we defined our InputObjectType. Now let's use it in one of field arguments:

```php
<?php
use GraphQL\Type\Definition\Type;
use GraphQL\Type\Definition\ObjectType;

$queryType = new ObjectType([
    'name' => 'Query',
    'fields' => [
        'stories' => [
            'type' => Type::listOf($storyType),
            'args' => [
                'filters' => [
                    'type' => Type::nonNull($filters),
                    'defaultValue' => [
                        'popular' => true
                    ]
                ]
            ],
            'resolve' => function($rootValue, $args) {
                return DataSource::filterStories($args['filters']);
            }
        ]
    ]
]);
```
(note that you can define **defaultValue** for fields with complex inputs as associative array).

Then GraphQL query could include filters as literal value:
```graphql
{
    stories(filters: {author: "1", popular: false})
}
```

Or as query variable:
```graphql
query($filters: StoryFiltersInput!) {
    stories(filters: $filters)
}
```
```php
$variables = [
    'filters' => [
        "author" => "1",
        "popular" => false
    ]
];
```

**graphql-php** will validate the input against your InputObjectType definition and pass it to your 
resolver as `$args['filters']`
