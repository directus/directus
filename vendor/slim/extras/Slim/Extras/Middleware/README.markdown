# Slim Authentication and XSS Middlewares

## Cache

Provides basic Caching functionality.

### How to use

    use \Slim\Slim;
    use \Slim\Extras\Middleware\Cache;
    use \Slim\Extras\Middleware\Cache\PDOCacheHandler;

    $db = ...
    $app = new Slim();
    $handler = new PDOCacheHandler($db);
    $app->add(new Cache($handler));

The example implementation `PDOCacheHandler` uses a PDO connection to a MySQL
database and the table structure included in `Cache/cache.sql`. You can write
your own handler by implementing the `ICacheHandler` interface.

## CsrfGuard

This is used to protect your website from CSRF attacks. 

### How to use

    use \Slim\Slim;
    use \Slim\Extras\Middleware\CsrfGuard;

    $app = new Slim();
    $app->add(new CsrfGuard());

In your view template add this to any web forms you have created.

    <input type="hidden" name="<?php echo $csrf_key; ?>" value="<?php echo $csrf_token; ?>">

## HttpBasic

This will provide you with basic user Authentication based on username and password set.

### How to use

    use \Slim\Slim;
    use \Slim\Extras\Middleware\HttpBasicAuth;

    $app = new Slim();
    $app->add(new HttpBasicAuth('theUsername', 'thePassword'));


## Strong

### How to use

You will need to pass Strong a config with all your secured routes and any information that is needed
for your Provider.

Here is some sample code for using PDO provider and securing some routes using regex.

    use \Slim\Slim;
    use \Slim\Extras\Middleware\StrongAuth;

    $app = new Slim();
    $config = array(
        'provider' => 'PDO',
        'pdo' => new PDO('mysql:host=localhost;dbname=database_name', 'username', 'password'),
        'auth.type' => 'form',
        'login.url' => '/',
        'security.urls' => array(
            array('path' => '/test'),
            array('path' => '/about/.+'),
        ),
    );

    $app->add(new StrongAuth($config));
