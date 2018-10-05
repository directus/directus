# Slim Framework Twig View

[![Build Status](https://travis-ci.org/slimphp/Twig-View.svg?branch=master)](https://travis-ci.org/slimphp/Twig-View)

This is a Slim Framework view helper built on top of the Twig templating component. You can use this component to create and render templates in your Slim Framework application. It works with Twig 1.18+ (PHP5.5+) and with Twig 2 (PHP7).

## Install

Via [Composer](https://getcomposer.org/)

```bash
$ composer require slim/twig-view
```

Requires Slim Framework 3 and PHP 5.5.0 or newer.

## Usage

```php
// Create Slim app
$app = new \Slim\App();

// Fetch DI Container
$container = $app->getContainer();

// Register Twig View helper
$container['view'] = function ($c) {
    $view = new \Slim\Views\Twig('path/to/templates', [
        'cache' => 'path/to/cache'
    ]);
    
    // Instantiate and add Slim specific extension
    $basePath = rtrim(str_ireplace('index.php', '', $c['request']->getUri()->getBasePath()), '/');
    $view->addExtension(new \Slim\Views\TwigExtension($c['router'], $basePath));

    return $view;
};

// Define named route
$app->get('/hello/{name}', function ($request, $response, $args) {
    return $this->view->render($response, 'profile.html', [
        'name' => $args['name']
    ]);
})->setName('profile');

// Render from string
$app->get('/hi/{name}', function ($request, $response, $args) {
    $str = $this->view->fetchFromString('<p>Hi, my name is {{ name }}.</p>', [
        'name' => $args['name']
    ]);
    $response->getBody()->write($str);
    return $response;
});

// Run app
$app->run();
```

## Custom template functions

`TwigExtension` provides these functions to your Twig templates:

* `path_for()` - returns the URL for a given route.
* `base_url()` - returns the `Uri` object's base URL.
* `is_current_path()` - returns true is the provided route name and parameters are valid for the current path.
* `current_path()` - renders the current path, with or without the query string.


You can use `path_for` to generate complete URLs to any Slim application named route and use `is_current_path` to determine if you need to mark a link as active as shown in this example Twig template:

    {% extends "layout.html" %}

    {% block body %}
    <h1>User List</h1>
    <ul>
        <li><a href="{{ path_for('profile', { 'name': 'josh' }) }}" {% if is_current_path('profle', { 'name': 'josh' }) %}class="active"{% endif %}>Josh</a></li>
        <li><a href="{{ path_for('profile', { 'name': 'andrew' }) }}">Andrew</a></li>
    </ul>
    {% endblock %}


## Testing

```bash
phpunit
```

## Contributing

Please see [CONTRIBUTING](CONTRIBUTING.md) for details.

## Security

If you discover any security related issues, please email security@slimframework.com instead of using the issue tracker.

## Credits

- [Josh Lockhart](https://github.com/codeguy)

## License

The MIT License (MIT). Please see [License File](LICENSE.md) for more information.
