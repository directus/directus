## Upgrade v0.12.x > v0.13.x

### Breaking (major): minimum supported version of PHP
New minimum required version of PHP is **7.1+**

### Breaking (major): default errors formatting changed according to spec 
**Category** and extensions assigned to errors are shown under `extensions` key
```php
$e = new Error(
    'msg',
    null,
    null,
    null,
    null,
    null,
    ['foo' => 'bar']
);
```
Formatting before the change:
```
'errors' => [
    [
        'message' => 'msg',
        'category' => 'graphql',
        'foo' => 'bar'
    ]
]
```
After the change:
```
'errors' => [
    [
        'message' => 'msg',
        'extensions' => [
            'category' => 'graphql',
            'foo' => 'bar',
        ],
    ]
]
```

Note: if error extensions contain `category` key - it has a priority over default category.

You can always switch to [custom error formatting](https://webonyx.github.io/graphql-php/error-handling/#custom-error-handling-and-formatting) to revert to the old format.

### Try it: Experimental Executor with improved performance
It is disabled by default. To enable it, do the following
```php
<?php
use GraphQL\Executor\Executor;
use GraphQL\Experimental\Executor\CoroutineExecutor;

Executor::setImplementationFactory([CoroutineExecutor::class, 'create']);
```

**Please post your feedback about new executor at https://github.com/webonyx/graphql-php/issues/397
Especially if you had issues (because it may become the default in one of the next releases)**

### Breaking: multiple interfaces separated with & in SDL
Before the change:
```graphql
type Foo implements Bar, Baz { field: Type }
```

After the change:
```graphql
type Foo implements Bar & Baz { field: Type }
```

To allow for an adaptive migration, use `allowLegacySDLImplementsInterfaces` option of parser:
```php
Parser::parse($source, [ 'allowLegacySDLImplementsInterfaces' => true])
```

### Breaking: several classes renamed

- `AbstractValidationRule` renamed to `ValidationRule` (NS `GraphQL\Validator\Rules`)
- `AbstractQuerySecurity` renamed to `QuerySecurityRule` (NS `GraphQL\Validator\Rules`)
- `FindBreakingChanges` renamed to `BreakingChangesFinder` (NS `GraphQL\Utils`)

### Breaking: new constructors

`GraphQL\Type\Definition\ResolveInfo` now takes 10 arguments instead of one array.

## Upgrade v0.11.x > v0.12.x

### Breaking: Minimum supported version is PHP5.6
Dropped support for PHP 5.5. This release still supports PHP 5.6 and PHP 7.0
**But the next major release will require PHP7.1+**

### Breaking: Custom scalar types need to throw on invalid value
As null might be a valid value custom types need to throw an
Exception inside `parseLiteral()`, `parseValue()` and `serialize()`. 

Returning null from any of these methods will now be treated as valid result.

### Breaking: Custom scalar types parseLiteral() declaration changed
A new parameter was added to `parseLiteral()`, which also needs to be added to any custom scalar type extending from `ScalarType`

Before:
```php
class MyType extends ScalarType {

    ...

    public function parseLiteral($valueNode) {
        //custom implementation
    }
}
```

After:
```php
class MyType extends ScalarType {

    ...

    public function parseLiteral($valueNode, array $variables = null) {
        //custom implementation
    }
}
```

### Breaking: Descriptions in comments are not used as descriptions by default anymore
Descriptions now need to be inside Strings or BlockStrings in order to be picked up as
description. If you want to keep the old behaviour you can supply the option `commentDescriptions`
to BuildSchema::buildAST(), BuildSchema::build() or Printer::doPrint().

Here is the official way now to define descriptions in the graphQL language:

Old:

```graphql
# Description
type Dog {
  ...
}
```

New:

```graphql
"Description"
type Dog {
  ...
}

"""
Long Description
"""
type Dog {
  ...
}
```

### Breaking: Cached AST of version 0.11.x is not compatible with 0.12.x.
That's because description in AST is now a separate node, not just a string. 
Make sure to renew caches.

### Breaking: Most of previously deprecated classes and methods were removed
See deprecation notices for previous versions in details.

### Breaking: Standard server expects `operationName` vs `operation` for multi-op queries
Before the change:
```json
{
  "queryId": "persisted-query-id",
  "operation": "QueryFromPersistedDocument",
  "variables": {}
}
```
After the change:
```json
{
  "queryId": "persisted-query-id",
  "operationName": "QueryFromPersistedDocument",
  "variables": {}
}
```
This naming is aligned with graphql-express version.

### Possibly Breaking: AST to array serialization excludes nulls
Most users won't be affected. It *may* affect you only if you do your own manipulations 
with exported AST. 

Example of json-serialized AST before the change:
```json
{
    "kind": "Field",
    "loc": null,
    "name": {
        "kind": "Name",
        "loc": null,
        "value": "id"
    },
    "alias": null,
    "arguments": [],
    "directives": [],
    "selectionSet": null
}
```
After the change:
```json
{
    "kind": "Field",
    "name": {
        "kind": "Name",
        "value": "id"
    },
    "arguments": [],
    "directives": []
}
```

## Upgrade v0.8.x, v0.9.x > v0.10.x

### Breaking: changed minimum PHP version from 5.4 to 5.5
It allows us to leverage `::class` constant, `generators` and other features of newer PHP versions.

### Breaking: default error formatting
By default exceptions thrown in resolvers will be reported with generic message `"Internal server error"`.
Only exceptions implementing interface `GraphQL\Error\ClientAware` and claiming themselves as `safe` will 
be reported with full error message.

This breaking change is done to avoid information leak in production when unhandled 
exceptions were reported to clients (e.g. database connection errors, file access errors, etc).

Also every error reported to client now has new `category` key which is either `graphql` or `internal`.
Exceptions implementing `ClientAware` interface may define their own custom categories.

During development or debugging use `$executionResult->toArray(true)`. It will add `debugMessage` key to 
each error entry in result. If you also want to add `trace` for each error - pass flags instead:

```
use GraphQL\Error\FormattedError;
$debug = FormattedError::INCLUDE_DEBUG_MESSAGE | FormattedError::INCLUDE_TRACE;
$result = GraphQL::executeAndReturnResult(/*args*/)->toArray($debug);
```

To change default `"Internal server error"` message to something else, use: 
```
GraphQL\Error\FormattedError::setInternalErrorMessage("Unexpected error");
```

**This change only affects default error reporting mechanism. If you set your own error formatter using 
`$executionResult->setErrorFormatter($myFormatter)` you won't be affected by this change.**

If you need to revert to old behavior temporary, use:

```php
GraphQL::executeAndReturnResult(/**/)
    ->setErrorFormatter('\GraphQL\Error\Error::formatError')
    ->toArray();
```
But note that this is deprecated format and will be removed in future versions. 

In general, if new default formatting doesn't work for you - just set [your own error
formatter](http://webonyx.github.io/graphql-php/error-handling/#custom-error-handling-and-formatting).

### Breaking: Validation rules now have abstract base class
Previously any callable was accepted by DocumentValidator as validation rule. Now only instances of 
`GraphQL\Validator\Rules\AbstractValidationRule` are allowed.

If you were using custom validation rules, just wrap them with 
`GraphQL\Validator\Rules\CustomValidationRule` (created for backwards compatibility).

Before:
```php
use GraphQL\Validator\DocumentValidator;

$myRule = function(ValidationContext $context) {};
DocumentValidator::validate($schema, $ast, [$myRule]);
```

After:
```php
use GraphQL\Validator\Rules\CustomValidationRule;
use GraphQL\Validator\DocumentValidator;

$myRule = new CustomValidationRule('MyRule', function(ValidationContext $context) {});
DocumentValidator::validate($schema, $ast, [$myRule]);
```

Also `DocumentValidator::addRule()` signature changed. 

Before the change:
```php
use GraphQL\Validator\DocumentValidator;

$myRule = function(ValidationContext $context) {};
DocumentValidator::addRule('MyRuleName', $myRule);
```

After the change:
```php
use GraphQL\Validator\DocumentValidator;

$myRule = new CustomValidationRulefunction('MyRule', ValidationContext $context) {});
DocumentValidator::addRule($myRule);
```


### Breaking: AST now uses `NodeList` vs array for lists of nodes
It helps us unserialize AST from array lazily. This change affects you only if you use `array_`
functions with AST or mutate AST directly.

Before the change:
```php
new GraphQL\Language\AST\DocumentNode([
    'definitions' => array(/*...*/)
]);
```
After the change:
```
new GraphQL\Language\AST\DocumentNode([
    'definitions' => new NodeList([/*...*/])
]);
```


### Breaking: scalar types now throw different exceptions when parsing and serializing
On invalid client input (`parseValue` and `parseLiteral`) they throw standard `GraphQL\Error\Error` 
but when they encounter invalid output (in `serialize`) they throw `GraphQL\Error\InvariantViolation`.

Previously they were throwing `GraphQL\Error\UserError`. This exception is no longer used so make sure 
to adjust if you were checking for this error in your custom error formatters.

### Breaking: removed previously deprecated ability to define type as callable
See https://github.com/webonyx/graphql-php/issues/35

### Deprecated: `GraphQL\GraphQL::executeAndReturnResult` 
Method is renamed to `GraphQL\GraphQL::executeQuery`. Old method name is still available, 
but will trigger deprecation warning in the next version.

### Deprecated: `GraphQL\GraphQL::execute`
Use `GraphQL\GraphQL::executeQuery()->toArray()` instead.
Old method still exists, but will trigger deprecation warning in next version.

### Deprecated: `GraphQL\Schema` moved to `GraphQL\Type\Schema`
Old class still exists, but will trigger deprecation warning in next version.

### Deprecated: `GraphQL\Utils` moved to `GraphQL\Utils\Utils`
Old class still exists, but triggers deprecation warning when referenced.

### Deprecated: `GraphQL\Type\Definition\Config`
If you were using config validation in previous versions, replace:
```php
GraphQL\Type\Definition\Config::enableValidation();
```
with: 
```php
$schema->assertValid();
``` 
See https://github.com/webonyx/graphql-php/issues/148

### Deprecated: experimental `GraphQL\Server`
Use [new PSR-7 compliant implementation](docs/executing-queries.md#using-server) instead.

### Deprecated: experimental `GraphQL\Type\Resolution` interface and implementations
Use schema [**typeLoader** option](docs/type-system/schema.md#lazy-loading-of-types) instead.

### Non-breaking: usage on async platforms
When using the library on async platforms use separate method `GraphQL::promiseToExecute()`. 
It requires promise adapter in it's first argument and always returns a `Promise`.

Old methods `GraphQL::execute` and `GraphQL::executeAndReturnResult` still work in backwards-compatible manner, 
but they are deprecated and will be removed eventually.

Same applies to Executor: use `Executor::promiseToExecute()` vs `Executor::execute()`.

## Upgrade v0.7.x > v0.8.x
All of those changes apply to those who extends various parts of this library.
If you only use the library and don't try to extend it - everything should work without breaks.


### Breaking: Custom directives handling
When passing custom directives to schema, default directives (like `@skip` and `@include`) 
are not added to schema automatically anymore. If you need them - add them explicitly with 
your other directives.

Before the change:
```php
$schema = new Schema([
   // ...
   'directives' => [$myDirective]
]);
```

After the change:
```php
$schema = new Schema([
    // ...
    'directives' => array_merge(GraphQL::getInternalDirectives(), [$myDirective])
]);
```

### Breaking: Schema protected property and methods visibility 
Most of the `protected` properties and methods of `GraphQL\Schema` were changed to `private`.
Please use public interface instead.

### Breaking: Node kind constants
Node kind constants were extracted from `GraphQL\Language\AST\Node` to 
separate class `GraphQL\Language\AST\NodeKind`

### Non-breaking: AST node classes renamed
AST node classes were renamed to disambiguate with types. e.g.:

```
GraphQL\Language\AST\Field -> GraphQL\Language\AST\FieldNode
GraphQL\Language\AST\OjbectValue -> GraphQL\Language\AST\OjbectValueNode
```
etc. 

Old names are still available via `class_alias` defined in `src/deprecated.php`. 
This file is included automatically when using composer autoloading.

### Deprecations
There are several deprecations which still work, but trigger `E_USER_DEPRECATED` when used.

For example `GraphQL\Executor\Executor::setDefaultResolveFn()` is renamed to `setDefaultResolver()`
but still works with old name.

## Upgrade v0.6.x > v0.7.x

There are a few new breaking changes in v0.7.0 that were added to the graphql-js reference implementation 
with the spec of April2016

### 1. Context for resolver

You can now pass a custom context to the `GraphQL::execute` function that is available in all resolvers as 3rd argument. 
This can for example be used to pass the current user etc.

Make sure to update all calls to `GraphQL::execute`, `GraphQL::executeAndReturnResult`, `Executor::execute` and all 
`'resolve'` callbacks in your app.
 
Before v0.7.0 `GraphQL::execute` signature looked this way:
 ```php
 GraphQL::execute(
     $schema,
     $query,
     $rootValue,
     $variables,
     $operationName
 );
 ```

Starting from v0.7.0 the signature looks this way (note the new `$context` argument):
```php
GraphQL::execute(
    $schema,
    $query,
    $rootValue,
    $context,
    $variables,
    $operationName
);
```

Before v.0.7.0 resolve callbacks had following signature:
```php
/**
 * @param mixed $object The parent resolved object
 * @param array $args Input arguments
 * @param ResolveInfo $info ResolveInfo object
 * @return mixed
 */
function resolveMyField($object, array $args, ResolveInfo $info) {
    //...
}
```

Starting from v0.7.0 the signature has changed to (note the new `$context` argument): 
```php
/**
 * @param mixed $object The parent resolved object
 * @param array $args Input arguments
 * @param mixed $context The context object hat was passed to GraphQL::execute
 * @param ResolveInfo $info ResolveInfo object
 * @return mixed
 */
function resolveMyField($object, array $args, $context, ResolveInfo $info){
    //...
}
```

### 2. Schema constructor signature

The signature of the Schema constructor now accepts an associative config array instead of positional arguments:
 
Before v0.7.0:
```php
$schema = new Schema($queryType, $mutationType);
```

Starting from v0.7.0:
```php
$schema = new Schema([
    'query' => $queryType,
    'mutation' => $mutationType,
    'types' => $arrayOfTypesWithInterfaces // See 3.
]);
```

### 3. Types can be directly passed to schema

There are edge cases when GraphQL cannot infer some types from your schema. 
One example is when you define a field of interface type and object types implementing 
this interface are not referenced anywhere else.

In such case object types might not be available when an interface is queried and query 
validation will fail. In that case, you need to pass the types that implement the
interfaces directly to the schema, so that GraphQL knows of their existence during query validation.

For example:
```php
$schema = new Schema([
    'query' => $queryType,
    'mutation' => $mutationType,
    'types' => $arrayOfTypesWithInterfaces
]);
```

Note that you don't need to pass all types here - only those types that GraphQL "doesn't see" 
automatically. Before v7.0.0 the workaround for this was to create a dumb (non-used) field per 
each "invisible" object type.

Also see [webonyx/graphql-php#38](https://github.com/webonyx/graphql-php/issues/38)
