# Slim Framework

[![Build Status](https://secure.travis-ci.org/codeguy/Slim.png)](http://travis-ci.org/codeguy/Slim)

Slim is a PHP micro framework that helps you quickly write simple yet powerful web applications and APIs.
Slim is easy to use for both beginners and professionals. Slim favors cleanliness over terseness and common cases
over edge cases. Its interface is simple, intuitive, and extensively documented — both online and in the code itself.
Thank you for choosing the Slim Framework for your next project. I think you're going to love it.

## Features

* Powerful router
    * Standard and custom HTTP methods
    * Route parameters with wildcards and conditions
    * Route redirect, halt, and pass
    * Route middleware
* Template rendering with custom views
* Flash messages
* Secure cookies with AES-256 encryption
* HTTP caching
* Logging with custom log writers
* Error handling and debugging
* Middleware and hook architecture
* Simple configuration

## Getting Started

### Install

You may install the Slim Framework with Composer (recommended) or manually.

[Read how to install Slim](http://docs.slimframework.com/pages/getting-started-install)

### System Requirements

You need **PHP >= 5.3.0**. If you use encrypted cookies, you'll also need the `mcrypt` extension.

### Hello World Tutorial

Instantiate a Slim application:

    $app = new \Slim\Slim();

Define a HTTP GET route:

    $app->get('/hello/:name', function ($name) {
        echo "Hello, $name";
    });

Run the Slim application:

    $app->run();

### Setup your web server

#### Apache

Ensure the `.htaccess` and `index.php` files are in the same public-accessible directory. The `.htaccess` file
should contain this code:

    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.php [QSA,L]

#### Nginx

Your nginx configuration file should contain this code (along with other settings you may need) in your `location` block:

    try_files $uri $uri/ /index.php;

This assumes that Slim's `index.php` is in the root folder of your project (www root).

#### lighttpd ####

Your lighttpd configuration file should contain this code (along with other settings you may need). This code requires
lighttpd >= 1.4.24.

    url.rewrite-if-not-file = ("(.*)" => "/index.php/$0")

This assumes that Slim's `index.php` is in the root folder of your project (www root).

## Documentation

<http://docs.slimframework.com/>

## How to Contribute

### Pull Requests

1. Fork the Slim Framework repository
2. Create a new branch for each feature or improvement
3. Send a pull request from each feature branch to the **develop** branch

It is very important to separate new features or improvements into separate feature branches, and to send a pull
request for each branch. This allows me to review and pull in new features or improvements individually.

### Style Guide

All pull requests must adhere to the [PSR-2](https://github.com/php-fig/fig-standards/blob/master/accepted/PSR-2-coding-style-guide.md) standard.

### Unit Testing

All pull requests must be accompanied by passing unit tests and complete code coverage. The Slim Framework uses
`phpunit` for testing.

[Learn about PHPUnit](https://github.com/sebastianbergmann/phpunit/)

## Community

### Forum and Knowledgebase

Visit Slim's official forum and knowledge base at <http://help.slimframework.com> where you can find announcements,
chat with fellow Slim users, ask questions, help others, or show off your cool Slim Framework apps.

### Twitter

Follow [@slimphp](http://www.twitter.com/slimphp) on Twitter to receive news and updates about the framework.

## Author

The Slim Framework is created and maintained by [Josh Lockhart](https://www.joshlockhart.com). Josh is a senior
web developer at [New Media Campaigns](http://www.newmediacampaigns.com/). Josh also created and maintains
[PHP: The Right Way](http://www.phptherightway.com/), a popular movement in the PHP community to introduce new
PHP programmers to best practices and good information.

## License

The Slim Framework is released under the MIT public license.

<http://www.slimframework.com/license>
