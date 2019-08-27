# Using Facade Method
Query execution is a complex process involving multiple steps, including query **parsing**,
**validating** and finally **executing** against your [schema](type-system/schema.md).

**graphql-php** provides a convenient facade for this process in class
[`GraphQL\GraphQL`](reference.md#graphqlgraphql):

```php
<?php
use GraphQL\GraphQL;

$result = GraphQL::executeQuery(
    $schema,
    $queryString,
    $rootValue = null,
    $context = null,
    $variableValues = null,
    $operationName = null,
    $fieldResolver = null,
    $validationRules = null
);
```

It returns an instance of [`GraphQL\Executor\ExecutionResult`](reference.md#graphqlexecutorexecutionresult)
which can be easily converted to array:

```php
$serializableResult = $result->toArray();
```

Returned array contains **data** and **errors** keys, as described by the
[GraphQL spec](http://facebook.github.io/graphql/#sec-Response-Format).
This array is suitable for further serialization (e.g. using **json_encode**).
See also the section on [error handling and formatting](error-handling.md).

Description of **executeQuery** method arguments:

Argument     | Type     | Notes
------------ | -------- | -----
schema       | [`GraphQL\Type\Schema`](#) | **Required.** Instance of your application [Schema](type-system/schema.md)
queryString  | `string` or `GraphQL\Language\AST\DocumentNode` | **Required.** Actual GraphQL query string to be parsed, validated and executed. If you parse query elsewhere before executing - pass corresponding AST document here to avoid new parsing.
rootValue  | `mixed` | Any value that represents a root of your data graph. It is passed as the 1st argument to field resolvers of [Query type](type-system/schema.md#query-and-mutation-types). Can be omitted or set to null if actual root values are fetched by Query type itself.
context  | `mixed` | Any value that holds information shared between all field resolvers. Most often they use it to pass currently logged in user, locale details, etc.<br><br>It will be available as the 3rd argument in all field resolvers. (see section on [Field Definitions](type-system/object-types.md#field-configuration-options) for reference) **graphql-php** never modifies this value and passes it *as is* to all underlying resolvers.
variableValues | `array` | Map of variable values passed along with query string. See section on [query variables on official GraphQL website](http://graphql.org/learn/queries/#variables). Note that while variableValues must be an associative array, the values inside it can be nested using \stdClass if desired.
operationName | `string` | Allows the caller to specify which operation in queryString will be run, in cases where queryString contains multiple top-level operations.
fieldResolver | `callable` | A resolver function to use when one is not provided by the schema. If not provided, the [default field resolver is used](data-fetching.md#default-field-resolver).
validationRules | `array` | A set of rules for query validation step. The default value is all available rules. Empty array would allow skipping query validation (may be convenient for persisted queries which are validated before persisting and assumed valid during execution)

# Using Server
If you are building HTTP GraphQL API, you may prefer our Standard Server
(compatible with [express-graphql](https://github.com/graphql/express-graphql)).
It supports more features out of the box, including parsing HTTP requests, producing a spec-compliant response; [batched queries](#query-batching); persisted queries.

Usage example (with plain PHP):

```php
<?php
use GraphQL\Server\StandardServer;

$server = new StandardServer([/* server options, see below */]);
$server->handleRequest(); // parses PHP globals and emits response
```

Server also supports [PSR-7 request/response interfaces](http://www.php-fig.org/psr/psr-7/):
```php
<?php
use GraphQL\Server\StandardServer;
use GraphQL\Executor\ExecutionResult;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\StreamInterface;

/** @var ServerRequestInterface $psrRequest */
/** @var ResponseInterface $psrResponse */
/** @var StreamInterface $psrBodyStream */
$server = new StandardServer([/* server options, see below */]);
$psrResponse = $server->processPsrRequest($psrRequest, $psrResponse, $psrBodyStream);


// Alternatively create PSR-7 response yourself:

/** @var ExecutionResult|ExecutionResult[] $result */
$result = $server->executePsrRequest($psrRequest);
$psrResponse = new SomePsr7ResponseImplementation(json_encode($result));
```

PSR-7 is useful when you want to integrate the server into existing framework:

- [PSR-7 for Laravel](https://laravel.com/docs/5.1/requests#psr7-requests)
- [Symfony PSR-7 Bridge](https://symfony.com/doc/current/components/psr7.html)
- [Slim](https://www.slimframework.com/docs/concepts/value-objects.html)
- [Zend Expressive](http://zendframework.github.io/zend-expressive/)

## Server configuration options

Argument     | Type     | Notes
------------ | -------- | -----
schema       | [`Schema`](reference.md#graphqltypeschema) | **Required.** Instance of your application [Schema](type-system/schema/)
rootValue  | `mixed` | Any value that represents a root of your data graph. It is passed as the 1st argument to field resolvers of [Query type](type-system/schema.md#query-and-mutation-types). Can be omitted or set to null if actual root values are fetched by Query type itself.
context  | `mixed` | Any value that holds information shared between all field resolvers. Most often they use it to pass currently logged in user, locale details, etc.<br><br>It will be available as the 3rd argument in all field resolvers. (see section on [Field Definitions](type-system/object-types.md#field-configuration-options) for reference) **graphql-php** never modifies this value and passes it *as is* to all underlying resolvers.
fieldResolver | `callable` | A resolver function to use when one is not provided by the schema. If not provided, the [default field resolver is used](data-fetching.md#default-field-resolver).
validationRules | `array` or `callable` | A set of rules for query validation step. The default value is all available rules. The empty array would allow skipping query validation (may be convenient for persisted queries which are validated before persisting and assumed valid during execution).<br><br>Pass `callable` to return different validation rules for different queries (e.g. empty array for persisted query and a full list of rules for regular queries). When passed, it is expected to have the following signature: <br><br> **function ([OperationParams](reference.md#graphqlserveroperationparams) $params, DocumentNode $node, $operationType): array**
queryBatching | `bool` | Flag indicating whether this server supports query batching ([apollo-style](https://dev-blog.apollodata.com/query-batching-in-apollo-63acfd859862)).<br><br> Defaults to **false**
debug | `int` | Debug flags. See [docs on error debugging](error-handling.md#debugging-tools) (flag values are the same).
persistentQueryLoader | `callable` | A function which is called to fetch actual query when server encounters **queryId** in request vs **query**.<br><br> The server does not implement persistence part (which you will have to build on your own), but it allows you to execute queries which were persisted previously.<br><br> Expected function signature:<br> **function ($queryId, [OperationParams](reference.md#graphqlserveroperationparams) $params)** <br><br>Function is expected to return query **string** or parsed **DocumentNode** <br><br> [Read more about persisted queries](https://dev-blog.apollodata.com/persisted-graphql-queries-with-apollo-client-119fd7e6bba5).
errorFormatter | `callable` | Custom error formatter. See [error handling docs](error-handling.md#custom-error-handling-and-formatting).
errorsHandler | `callable` | Custom errors handler. See [error handling docs](error-handling.md#custom-error-handling-and-formatting).
promiseAdapter | [`PromiseAdapter`](reference.md#graphqlexecutorpromisepromiseadapter) | Required for [Async PHP](data-fetching/#async-php) only.

**Server config instance**

If you prefer fluid interface for config with autocomplete in IDE and static time validation,
use [`GraphQL\Server\ServerConfig`](reference.md#graphqlserverserverconfig) instead of an array:

```php
<?php
use GraphQL\Server\ServerConfig;
use GraphQL\Server\StandardServer;

$config = ServerConfig::create()
    ->setSchema($schema)
    ->setErrorFormatter($myFormatter)
    ->setDebug($debug)
;

$server = new StandardServer($config);
```

## Query batching
Standard Server supports query batching ([apollo-style](https://dev-blog.apollodata.com/query-batching-in-apollo-63acfd859862)).

One of the major benefits of Server over a sequence of **executeQuery()** calls is that
[Deferred resolvers](data-fetching.md#solving-n1-problem) won't be isolated in queries.
So for example following batch will require single DB request (if user field is deferred):

```json
[
  {
    "query": "{user(id: 1) { id }}"
  },
  {
    "query": "{user(id: 2) { id }}"
  },
  {
    "query": "{user(id: 3) { id }}"
  }
]
```

To enable query batching, pass **queryBatching** option in server config:
```php
<?php
use GraphQL\Server\StandardServer;

$server = new StandardServer([
    'queryBatching' => true
]);
```

# Custom Validation Rules
Before execution, a query is validated using a set of standard rules defined by the GraphQL spec.
It is possible to override standard set of rules globally or per execution.

Add rules globally:
```php
<?php
use GraphQL\Validator\Rules;
use GraphQL\Validator\DocumentValidator;

// Add to standard set of rules globally:
DocumentValidator::addRule(new Rules\DisableIntrospection());
```

Custom rules per execution:
```php
<?php
use GraphQL\GraphQL;
use GraphQL\Validator\Rules;

$myValiationRules = array_merge(
    GraphQL::getStandardValidationRules(),
    [
        new Rules\QueryComplexity(100),
        new Rules\DisableIntrospection()
    ]
);

$result = GraphQL::executeQuery(
    $schema,
    $queryString,
    $rootValue = null,
    $context = null,
    $variableValues = null,
    $operationName = null,
    $fieldResolver = null,
    $myValiationRules // <-- this will override global validation rules for this request
);
```

Or with a standard server:
```php
<?php
use GraphQL\Server\StandardServer;

$server = new StandardServer([
    'validationRules' => $myValiationRules
]);
```
