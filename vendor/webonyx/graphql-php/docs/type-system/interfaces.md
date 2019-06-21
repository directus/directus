# Interface Type Definition
An Interface is an abstract type that includes a certain set of fields that a 
type must include to implement the interface.

In **graphql-php** interface type is an instance of `GraphQL\Type\Definition\InterfaceType` 
(or one of its subclasses) which accepts configuration array in a constructor:

```php
<?php
use GraphQL\Type\Definition\InterfaceType;
use GraphQL\Type\Definition\Type;

$character = new InterfaceType([
    'name' => 'Character',
    'description' => 'A character in the Star Wars Trilogy',
    'fields' => [
        'id' => [
            'type' => Type::nonNull(Type::string()),
            'description' => 'The id of the character.',
        ],
        'name' => [
            'type' => Type::string(),
            'description' => 'The name of the character.'
        ]
    ],
    'resolveType' => function ($value) {
        if ($value->type === 'human') {
            return MyTypes::human();            
        } else {
            return MyTypes::droid();
        }
    }
]);
```
This example uses **inline** style for Interface definition, but you can also use  
[inheritance or type language](index.md#type-definition-styles).

# Configuration options
The constructor of InterfaceType accepts an array. Below is a full list of allowed options:

Option | Type | Notes
------ | ---- | -----
name | `string` | **Required.** Unique name of this interface type within Schema
fields | `array` | **Required.** List of fields required to be defined by interface implementors. Same as [Fields for Object Type](object-types.md#field-configuration-options)
description | `string` | Plain-text description of this type for clients (e.g. used by [GraphiQL](https://github.com/graphql/graphiql) for auto-generated documentation)
resolveType | `callback` | **function($value, $context, [ResolveInfo](../reference.md#graphqltypedefinitionresolveinfo) $info)**<br> Receives **$value** from resolver of the parent field and returns concrete interface implementor for this **$value**.

# Implementing interface
To implement the Interface simply add it to **interfaces** array of Object Type definition:
```php
<?php
use GraphQL\Type\Definition\Type;
use GraphQL\Type\Definition\ObjectType;

$humanType = new ObjectType([
    'name' => 'Human',
    'fields' => [
        'id' => [
            'type' => Type::nonNull(Type::string()),
            'description' => 'The id of the character.',
        ],
        'name' => [
            'type' => Type::string(),
            'description' => 'The name of the character.'
        ]
    ],
    'interfaces' => [
        $character
    ]
]);
```
Note that Object Type must include all fields of interface with exact same types 
(including **nonNull** specification) and arguments.

The only exception is when object's field type is more specific than the type of this field defined in interface 
(see [Covariant return types for interface fields](#covariant-return-types-for-interface-fields) below)

# Covariant return types for interface fields
Object types implementing interface may change the field type to more specific.
Example:

```
interface A {
  field1: A
}

type B implements A {
  field1: B
}
```

# Sharing Interface fields
Since every Object Type implementing an Interface must have the same set of fields - it often makes 
sense to reuse field definitions of Interface in Object Types:

```php
<?php
use GraphQL\Type\Definition\Type;
use GraphQL\Type\Definition\ObjectType;

$humanType = new ObjectType([
    'name' => 'Human',
    'interfaces' => [
        $character
    ],
    'fields' => [
        'height' => Type::float(),
        $character->getField('id'),
        $character->getField('name')
    ] 
]);
```

In this case, field definitions are created only once (as a part of Interface Type) and then 
reused by all interface implementors. It can save several microseconds and kilobytes + ensures that 
field definitions of Interface and implementors are always in sync.

Yet it creates a problem with the resolution of such fields. There are two ways how shared fields could 
be resolved:

1. If field resolution algorithm is the same for all Interface implementors - you can simply add 
**resolve** option to field definition in Interface itself.

2. If field resolution varies for different implementations - you can specify **resolveField** 
option in [Object Type config](object-types.md#configuration-options) and handle field 
resolutions there 
(Note: **resolve** option in field definition has precedence over **resolveField** option in object type definition)

# Interface role in data fetching
The only responsibility of interface in Data Fetching process is to return concrete Object Type 
for given **$value** in **resolveType**. Then resolution of fields is delegated to resolvers of this 
concrete Object Type.

If a **resolveType** option is omitted, graphql-php will loop through all interface implementors and 
use their **isTypeOf** callback to pick the first suitable one. This is obviously less efficient 
than single **resolveType** call. So it is recommended to define **resolveType** whenever possible.
