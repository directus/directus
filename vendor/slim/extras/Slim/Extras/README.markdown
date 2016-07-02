# Slim Framework Extras

This repository contains extra resources that complement the Slim Framework, a PHP micro framework that helps
you quickly write simple yet powerful web applications.

## Custom Views

This repository contains custom views for your Slim Framework applications. Custom views let you easily
use popular third-party templating frameworks, like [Twig](http://twig.sensiolabs.org/) or
[Smarty](http://www.smarty.net/), with your Slim Framework application.

* Smarty
* Twig
* Mustache
* Haml
* Haanga
* Blitz
* Dwoo
* Sugar
* Savant
* Rain
* H2o

This example demonstrates how to use the custom Twig view in your Slim Framework application:

    <?php
    // Setup custom Twig view
    $twigView = new \Slim\Extras\Views\Twig();

    // Instantiate application
    $app = new \Slim\Slim(array(
        'view' => $twigView
    ));

This example assumes you are autoloading dependencies using [Composer](http://getcomposer.org/). If you are not
using Composer, you must manually `require` the custom view class before instantiating it.

Read the [Slim Framework documentation](http://docs.slimframework.com/pages/view-custom/) to learn how to write
your own custom view.

## Middleware

This repository also contains middleware for your Slim Framework application. This
example demonstrates how to apply HTTP basic authentication to a Slim Framework application:

    <?php
    $app = new \Slim\Slim();
    $app->add(new \Slim\Extras\Middleware\HttpBasicAuth('username', 'password'));

This example assumes you are autoloading dependencies using [Composer](http://getcomposer.org/). If you are not
using Composer, you must manually `require` the custom middleware class before instantiating it.

## Log Writers

This repository also contains custom log writers for your Slim Framwork application. This example
demonstrates how to use the custom `DateTimeLogWriter` to write rolling log files from your Slim Framework application:

    <?php
    $app = new \Slim\Slim(array(
        'log.writer' => new \Slim\Extras\Log\DateTimeFileWriter(array(
            'path' => './logs',
            'name_format' => 'Y-m-d',
            'message_format' => '%label% - %date% - %message%'
        ))
    ));

This example assumes you are autoloading dependencies using [Composer](http://getcomposer.org/). If you are not
using Composer, you must manually `require` the log writer class before instantiating it.

## Author

The Slim Framework is created and maintained by [Josh Lockhart](https://www.joshlockhart.com). Josh is a senior
web developer at [New Media Campaigns](http://www.newmediacampaigns.com/). Josh also created and maintains
[PHP: The Right Way](http://www.phptherightway.com/), a popular movement in the PHP community to introduce new
PHP programmers to best practices and good information.

The Slim Framework Extras repository is maintained by [Andrew Smith](https://github.com/silentworks).

## License

The Slim Framework is released under the MIT public license.

<http://www.slimframework.com/license>
