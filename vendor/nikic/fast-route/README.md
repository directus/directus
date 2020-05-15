FastRoute - Fast request router for PHP
=======================================

This library provides a fast implementation of a regular expression based router. [Blog post explaining how the
implementation works and why it is fast.][blog_post]

Install
-------

To install with composer:

```sh
composer require nikic/fast-route
```

Requires PHP 5.4 or newer.

Usage
-----

Here's a basic usage example:

```php
<?php

require '/path/to/vendor/autoload.php';

$dispatcher = FastRoute\simpleDispatcher(function(FastRoute\RouteCollector $r) {
    $r->addRoute('GET', '/users', 'get_all_users_handler');
    // {id} must be a number (\d+)
    $r->addRoute('GET', '/user/{id:\d+}', 'get_user_handler');
    // The /{title} suffix is optional
    $r->addRoute('GET', '/articles/{id:\d+}[/{title}]', 'get_article_handler');
});

// Fetch method and URI from somewhere
$httpMethod = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];

// Strip query string (?foo=bar) and decode URI
if (false !== $pos = strpos($uri, '?')) {
    $uri = substr($uri, 0, $pos);
}
$uri = rawurldecode($uri);

$routeInfo = $dispatcher->dispatch($httpMethod, $uri);
switch ($routeInfo[0]) {
    case FastRoute\Dispatcher::NOT_FOUND:
        // ... 404 Not Found
        break;
    case FastRoute\Dispatcher::METHOD_NOT_ALLOWED:
        $allowedMethods = $routeInfo[1];
        // ... 405 Method Not Allowed
        break;
    case FastRoute\Dispatcher::FOUND:
        $handler = $routeInfo[1];
        $vars = $routeInfo[2];
        // ... call $handler with $vars
        break;
}
```

### Defining routes

The routes are defined by calling the `FastRoute\simpleDispatcher()` function, which accepts
a callable taking a `FastRoute\RouteCollector` instance. The routes are added by calling
`addRoute()` on the collector instance:

```php
$r->addRoute($method, $routePattern, $handler);
```

The `$method` is an uppercase HTTP method string for which a certain route should match. It
is possible to specify multiple valid methods using an array:

```php
// These two calls
$r->addRoute('GET', '/test', 'handler');
$r->addRoute('POST', '/test', 'handler');
// Are equivalent to this one call
$r->addRoute(['GET', 'POST'], '/test', 'handler');
```

By default the `$routePattern` uses a syntax where `{foo}` specifies a placeholder with name `foo`
and matching the regex `[^/]+`. To adjust the pattern the placeholder matches, you can specify
a custom pattern by writing `{bar:[0-9]+}`. Some examples:

```php
// Matches /user/42, but not /user/xyz
$r->addRoute('GET', '/user/{id:\d+}', 'handler');

// Matches /user/foobar, but not /user/foo/bar
$r->addRoute('GET', '/user/{name}', 'handler');

// Matches /user/foo/bar as well
$r->addRoute('GET', '/user/{name:.+}', 'handler');
```

Custom patterns for route placeholders cannot use capturing groups. For example `{lang:(en|de)}`
is not a valid placeholder, because `()` is a capturing group. Instead you can use either
`{lang:en|de}` or `{lang:(?:en|de)}`.

Furthermore parts of the route enclosed in `[...]` are considered optional, so that `/foo[bar]`
will match both `/foo` and `/foobar`. Optional parts are only supported in a trailing position,
not in the middle of a route.

```php
// This route
$r->addRoute('GET', '/user/{id:\d+}[/{name}]', 'handler');
// Is equivalent to these two routes
$r->addRoute('GET', '/user/{id:\d+}', 'handler');
$r->addRoute('GET', '/user/{id:\d+}/{name}', 'handler');

// Multiple nested optional parts are possible as well
$r->addRoute('GET', '/user[/{id:\d+}[/{name}]]', 'handler');

// This route is NOT valid, because optional parts can only occur at the end
$r->addRoute('GET', '/user[/{id:\d+}]/{name}', 'handler');
```

The `$handler` parameter does not necessarily have to be a callback, it could also be a controller
class name or any other kind of data you wish to associate with the route. FastRoute only tells you
which handler corresponds to your URI, how you interpret it is up to you.

#### Shorcut methods for common request methods

For the `GET`, `POST`, `PUT`, `PATCH`, `DELETE` and `HEAD` request methods shortcut methods are available. For example:

```php
$r->get('/get-route', 'get_handler');
$r->post('/post-route', 'post_handler');
```

Is equivalent to:

```php
$r->addRoute('GET', '/get-route', 'get_handler');
$r->addRoute('POST', '/post-route', 'post_handler');
```

#### Route Groups

Additionally, you can specify routes inside of a group. All routes defined inside a group will have a common prefix.

For example, defining your routes as:

```php
$r->addGroup('/admin', function (RouteCollector $r) {
    $r->addRoute('GET', '/do-something', 'handler');
    $r->addRoute('GET', '/do-another-thing', 'handler');
    $r->addRoute('GET', '/do-something-else', 'handler');
});
```

Will have the same result as:

 ```php
$r->addRoute('GET', '/admin/do-something', 'handler');
$r->addRoute('GET', '/admin/do-another-thing', 'handler');
$r->addRoute('GET', '/admin/do-something-else', 'handler');
 ```

Nested groups are also supported, in which case the prefixes of all the nested groups are combined.

### Caching

The reason `simpleDispatcher` accepts a callback for defining the routes is to allow seamless
caching. By using `cachedDispatcher` instead of `simpleDispatcher` you can cache the generated
routing data and construct the dispatcher from the cached information:

```php
<?php

$dispatcher = FastRoute\cachedDispatcher(function(FastRoute\RouteCollector $r) {
    $r->addRoute('GET', '/user/{name}/{id:[0-9]+}', 'handler0');
    $r->addRoute('GET', '/user/{id:[0-9]+}', 'handler1');
    $r->addRoute('GET', '/user/{name}', 'handler2');
}, [
    'cacheFile' => __DIR__ . '/route.cache', /* required */
    'cacheDisabled' => IS_DEBUG_ENABLED,     /* optional, enabled by default */
]);
```

The second parameter to the function is an options array, which can be used to specify the cache
file location, among other things.

### Dispatching a URI

A URI is dispatched by calling the `dispatch()` method of the created dispatcher. This method
accepts the HTTP method and a URI. Getting those two bits of information (and normalizing them
appropriately) is your job - this library is not bound to the PHP web SAPIs.

The `dispatch()` method returns an array whose first element contains a status code. It is one
of `Dispatcher::NOT_FOUND`, `Dispatcher::METHOD_NOT_ALLOWED` and `Dispatcher::FOUND`. For the
method not allowed status the second array element contains a list of HTTP methods allowed for
the supplied URI. For example:

    [FastRoute\Dispatcher::METHOD_NOT_ALLOWED, ['GET', 'POST']]

> **NOTE:** The HTTP specification requires that a `405 Method Not Allowed` response include the
`Allow:` header to detail available methods for the requested resource. Applications using FastRoute
should use the second array element to add this header when relaying a 405 response.

For the found status the second array element is the handler that was associated with the route
and the third array element is a dictionary of placeholder names to their values. For example:

    /* Routing against GET /user/nikic/42 */

    [FastRoute\Dispatcher::FOUND, 'handler0', ['name' => 'nikic', 'id' => '42']]

### Overriding the route parser and dispatcher

The routing process makes use of three components: A route parser, a data generator and a
dispatcher. The three components adhere to the following interfaces:

```php
<?php

namespace FastRoute;

interface RouteParser {
    public function parse($route);
}

interface DataGenerator {
    public function addRoute($httpMethod, $routeData, $handler);
    public function getData();
}

interface Dispatcher {
    const NOT_FOUND = 0, FOUND = 1, METHOD_NOT_ALLOWED = 2;

    public function dispatch($httpMethod, $uri);
}
```

The route parser takes a route pattern string and converts it into an array of route infos, where
each route info is again an array of it's parts. The structure is best understood using an example:

    /* The route /user/{id:\d+}[/{name}] converts to the following array: */
    [
        [
            '/user/',
            ['id', '\d+'],
        ],
        [
            '/user/',
            ['id', '\d+'],
            '/',
            ['name', '[^/]+'],
        ],
    ]

This array can then be passed to the `addRoute()` method of a data generator. After all routes have
been added the `getData()` of the generator is invoked, which returns all the routing data required
by the dispatcher. The format of this data is not further specified - it is tightly coupled to
the corresponding dispatcher.

The dispatcher accepts the routing data via a constructor and provides a `dispatch()` method, which
you're already familiar with.

The route parser can be overwritten individually (to make use of some different pattern syntax),
however the data generator and dispatcher should always be changed as a pair, as the output from
the former is tightly coupled to the input of the latter. The reason the generator and the
dispatcher are separate is that only the latter is needed when using caching (as the output of
the former is what is being cached.)

When using the `simpleDispatcher` / `cachedDispatcher` functions from above the override happens
through the options array:

```php
<?php

$dispatcher = FastRoute\simpleDispatcher(function(FastRoute\RouteCollector $r) {
    /* ... */
}, [
    'routeParser' => 'FastRoute\\RouteParser\\Std',
    'dataGenerator' => 'FastRoute\\DataGenerator\\GroupCountBased',
    'dispatcher' => 'FastRoute\\Dispatcher\\GroupCountBased',
]);
```

The above options array corresponds to the defaults. By replacing `GroupCountBased` by
`GroupPosBased` you could switch to a different dispatching strategy.

### A Note on HEAD Requests

The HTTP spec requires servers to [support both GET and HEAD methods][2616-511]:

> The methods GET and HEAD MUST be supported by all general-purpose servers

To avoid forcing users to manually register HEAD routes for each resource we fallback to matching an
available GET route for a given resource. The PHP web SAPI transparently removes the entity body
from HEAD responses so this behavior has no effect on the vast majority of users.

However, implementers using FastRoute outside the web SAPI environment (e.g. a custom server) MUST
NOT send entity bodies generated in response to HEAD requests. If you are a non-SAPI user this is
*your responsibility*; FastRoute has no purview to prevent you from breaking HTTP in such cases.

Finally, note that applications MAY always specify their own HEAD method route for a given
resource to bypass this behavior entirely.

### Credits

This library is based on a router that [Levi Morrison][levi] implemented for the Aerys server.

A large number of tests, as well as HTTP compliance considerations, were provided by [Daniel Lowrey][rdlowrey].


[2616-511]: http://www.w3.org/Protocols/rfc2616/rfc2616-sec5.html#sec5.1.1 "RFC 2616 Section 5.1.1"
[blog_post]: http://nikic.github.io/2014/02/18/Fast-request-routing-using-regular-expressions.html
[levi]: https://github.com/morrisonlevi
[rdlowrey]: https://github.com/rdlowrey
