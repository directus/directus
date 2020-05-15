# Object Type Definition
Object Type is the most frequently used primitive in a typical GraphQL application.

Conceptually Object Type is a collection of Fields. Each field, in turn,
has its own type which allows building complex hierarchies.

In **graphql-php** object type is an instance of `GraphQL\Type\Definition\ObjectType` 
(or one of it subclasses) which accepts configuration array in constructor:

```php
<?php
namespace MyApp;

use GraphQL\Type\Definition\ObjectType;
use GraphQL\Type\Definition\Type;
use GraphQL\Examples\Blog\Data\DataSource;
use GraphQL\Examples\Blog\Data\Story;

$userType = new ObjectType([
    'name' => 'User',
    'description' => 'Our blog visitor',
    'fields' => [
        'firstName' => [
            'type' => Type::string(),
            'description' => 'User first name'
        ],
        'email' => Type::string()
    ]
]);

$blogStory = new ObjectType([
    'name' => 'Story',
    'fields' => [
        'body' => Type::string(),
        'author' => [
            'type' => $userType,
            'description' => 'Story author',
            'resolve' => function(Story $blogStory) {
                return DataSource::findUser($blogStory->authorId);
            }
        ],
        'likes' => [
            'type' => Type::listOf($userType),
            'description' => 'List of users who liked the story',
            'args' => [
                'limit' => [
                    'type' => Type::int(),
                    'description' => 'Limit the number of recent likes returned',
                    'defaultValue' => 10
                ]
            ],
            'resolve' => function(Story $blogStory, $args) {
                return DataSource::findLikes($blogStory->id, $args['limit']);
            }
        ]
    ]
]);
```
This example uses **inline** style for Object Type definitions, but you can also use  
[inheritance or type language](index.md#type-definition-styles).


# Configuration options
Object type constructor expects configuration array. Below is a full list of available options:

Option       | Type     | Notes
------------ | -------- | -----
name         | `string` | **Required.** Unique name of this object type within Schema
fields       | `array` or `callable` | **Required**. An array describing object fields or callable returning such an array. See [Fields](#field-definitions) section below for expected structure of each array entry. See also the section on [Circular types](#recurring-and-circular-types) for an explanation of when to use callable for this option.
description  | `string` | Plain-text description of this type for clients (e.g. used by [GraphiQL](https://github.com/graphql/graphiql) for auto-generated documentation)
interfaces   | `array` or `callable` | List of interfaces implemented by this type or callable returning such a list. See [Interface Types](interfaces.md) for details. See also the section on [Circular types](#recurring-and-circular-types) for an explanation of when to use callable for this option.
isTypeOf     | `callable` | **function($value, $context, [ResolveInfo](../reference.md#graphqltypedefinitionresolveinfo) $info)**<br> Expected to return **true** if **$value** qualifies for this type (see section about [Abstract Type Resolution](interfaces.md#interface-role-in-data-fetching) for explanation).
resolveField | `callable` | **function($value, $args, $context, [ResolveInfo](../reference.md#graphqltypedefinitionresolveinfo) $info)**<br> Given the **$value** of this type, it is expected to return value for a field defined in **$info->fieldName**. A good place to define a type-specific strategy for field resolution. See section on [Data Fetching](../data-fetching.md) for details.

# Field configuration options
Below is a full list of available field configuration options:

Option | Type | Notes
------ | ---- | -----
name | `string` | **Required.** Name of the field. When not set - inferred from **fields** array key (read about [shorthand field definition](#shorthand-field-definitions) below)
type | `Type` | **Required.** An instance of internal or custom type. Note: type must be represented by a single instance within one schema (see also [Type Registry](index.md#type-registry))
args | `array` | An array of possible type arguments. Each entry is expected to be an array with keys: **name**, **type**, **description**, **defaultValue**. See [Field Arguments](#field-arguments) section below.
resolve | `callable` | **function($value, $args, $context, [ResolveInfo](../reference.md#graphqltypedefinitionresolveinfo) $info)**<br> Given the **$value** of this type, it is expected to return actual value of the current field. See section on [Data Fetching](../data-fetching.md) for details
complexity | `callable` | **function($childrenComplexity, $args)**<br> Used to restrict query complexity. The feature is disabled by default, read about [Security](../security.md#query-complexity-analysis) to use it.
description | `string` | Plain-text description of this field for clients (e.g. used by [GraphiQL](https://github.com/graphql/graphiql) for auto-generated documentation)
deprecationReason | `string` | Text describing why this field is deprecated. When not empty - field will not be returned by introspection queries (unless forced)

# Field arguments
Every field on a GraphQL object type can have zero or more arguments, defined in **args** option of field definition.
Each argument is an array with following options:

Option | Type | Notes
------ | ---- | -----
name | `string` | **Required.** Name of the argument. When not set - inferred from **args** array key
type | `Type` | **Required.** Instance of one of [Input Types](input-types.md) (**scalar**, **enum**, **InputObjectType** + any combination of those with **nonNull** and **listOf** modifiers)
description | `string` | Plain-text description of this argument for clients (e.g. used by [GraphiQL](https://github.com/graphql/graphiql) for auto-generated documentation)
defaultValue | `scalar` | Default value for this argument. Use the internal value if specifying a default for an **enum** type

# Shorthand field definitions
Fields can be also defined in **shorthand** notation (with only **name** and **type** options):
```php
'fields' => [
    'id' => Type::id(),
    'fieldName' => $fieldType
]
```
which is equivalent of:
```php
'fields' => [
    'id' => ['type' => Type::id()],
    'fieldName' => ['type' => $fieldName]
]
```
which is in turn equivalent of the full form:
```php
'fields' => [
    ['name' => 'id', 'type' => Type::id()],
    ['name' => 'fieldName', 'type' => $fieldName]
]
```
Same shorthand notation applies to field arguments as well.

# Recurring and circular types
Almost all real-world applications contain recurring or circular types. 
Think user friends or nested comments for example. 

**graphql-php** allows such types, but you have to use `callable` in 
option **fields** (and/or **interfaces**).
 
For example:
```php
<?php
use GraphQL\Type\Definition\Type;
use GraphQL\Type\Definition\ObjectType;

$userType = null;

$userType = new ObjectType([
    'name' => 'User',
    'fields' => function() use (&$userType) {
        return [
            'email' => [
                'type' => Type::string()
            ],
            'friends' => [
                'type' => Type::listOf($userType)
            ]
        ];
    }
]);
```

Same example for [inheritance style of type definitions](index.md#type-definition-styles) using [TypeRegistry](index.md#type-registry):
```php
<?php
namespace MyApp;

use GraphQL\Type\Definition\Type;
use GraphQL\Type\Definition\ObjectType;

class UserType extends ObjectType
{
    public function __construct()
    {
        $config = [
            'fields' => function() {
                return [
                    'email' => MyTypes::string(),
                    'friends' => MyTypes::listOf(MyTypes::user())
                ];
            }
        ];
        parent::__construct($config);
    }
}

class MyTypes 
{
    private static $user;
    
    public static function user()
    {
        return self::$user ?: (self::$user = new UserType());
    }
    
    public static function string()
    {
        return Type::string();
    }
    
    public static function listOf($type)
    {
        return Type::listOf($type);
    }
}
```

# Field Resolution
Field resolution is the primary mechanism in **graphql-php** for returning actual data for your fields.
It is implemented using **resolveField** callable in type definition or **resolve**
callable in field definition (which has precedence).

Read the section on [Data Fetching](../data-fetching.md) for a complete description of this process.

# Custom Metadata
All types in **graphql-php** accept configuration array. In some cases, you may be interested in 
passing your own metadata for type or field definition.

**graphql-php** preserves original configuration array in every type or field instance in 
public property **$config**. Use it to implement app-level mappings and definitions.
