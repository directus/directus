# Built-in Scalar Types
GraphQL specification describes several built-in scalar types. In **graphql-php** they are 
exposed as static methods of [`GraphQL\Type\Definition\Type`](../reference.md#graphqltypedefinitiontype) class:

```php
<?php
use GraphQL\Type\Definition\Type;

// Built-in Scalar types:
Type::string();  // String type
Type::int();     // Int type
Type::float();   // Float type
Type::boolean(); // Boolean type
Type::id();      // ID type
```
Those methods return instances of `GraphQL\Type\Definition\ScalarType` (actually one of subclasses).
Use them directly in type definitions, or wrap in your [TypeRegistry](index.md#type-registry) 
(if you use one).

# Writing Custom Scalar Types
In addition to built-in scalars, you can define your own scalar types with additional validation. 
Typical examples of such types are **Email**, **Date**, **Url**, etc.

In order to implement your own type, you must understand how scalars are presented in GraphQL.
GraphQL deals with scalars in following cases:

1. When converting **internal representation** of value returned by your app (e.g. stored in a database 
or hardcoded in the source code) to **serialized** representation included in the response.
 
2. When converting **input value** passed by a client in variables along with GraphQL query to 
**internal representation** of your app.

3. When converting **input literal value** hardcoded in GraphQL query (e.g. field argument value) to 
the **internal representation** of your app.

Those cases are covered by methods `serialize`, `parseValue` and `parseLiteral` of abstract `ScalarType` 
class respectively.

Here is an example of a simple **Email** type:

```php
<?php
namespace MyApp;

use GraphQL\Error\Error;
use GraphQL\Error\InvariantViolation;
use GraphQL\Language\AST\StringValueNode;
use GraphQL\Type\Definition\ScalarType;
use GraphQL\Utils\Utils;

class EmailType extends ScalarType
{
    // Note: name can be omitted. In this case it will be inferred from class name 
    // (suffix "Type" will be dropped)
    public $name = 'Email';

    /**
     * Serializes an internal value to include in a response.
     *
     * @param string $value
     * @return string
     */
    public function serialize($value)
    {
        // Assuming internal representation of email is always correct:
        return $value;
        
        // If it might be incorrect and you want to make sure that only correct values are included
        // in response - use following line instead:
        // if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
        //     throw new InvariantViolation("Could not serialize following value as email: " . Utils::printSafe($value));
        // }
        // return $this->parseValue($value);
    }

    /**
     * Parses an externally provided value (query variable) to use as an input
     *
     * @param mixed $value
     * @return mixed
     */
    public function parseValue($value)
    {
        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
            throw new Error("Cannot represent following value as email: " . Utils::printSafeJson($value));
        }
        return $value;
    }

    /**
     * Parses an externally provided literal value (hardcoded in GraphQL query) to use as an input.
     * 
     * E.g. 
     * {
     *   user(email: "user@example.com") 
     * }
     *
     * @param \GraphQL\Language\AST\Node $valueNode
     * @param array|null $variables
     * @return string
     * @throws Error
     */
    public function parseLiteral($valueNode, array $variables = null)
    {
        // Note: throwing GraphQL\Error\Error vs \UnexpectedValueException to benefit from GraphQL
        // error location in query:
        if (!$valueNode instanceof StringValueNode) {
            throw new Error('Query error: Can only parse strings got: ' . $valueNode->kind, [$valueNode]);
        }
        if (!filter_var($valueNode->value, FILTER_VALIDATE_EMAIL)) {
            throw new Error("Not a valid email", [$valueNode]);
        }
        return $valueNode->value;
    }
}
```

Or with inline style:

```php
<?php
use GraphQL\Type\Definition\CustomScalarType;

$emailType = new CustomScalarType([
    'name' => 'Email',
    'serialize' => function($value) {/* See function body above */},
    'parseValue' => function($value) {/* See function body above */},
    'parseLiteral' => function($valueNode, array $variables = null) {/* See function body above */},
]);
```
