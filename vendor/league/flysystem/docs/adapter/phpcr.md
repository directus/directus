---
layout: default
permalink: /adapter/phpcr/
title: PHPCR Adapter
---

# PHPCR Adapter

This adapter works with any [PHPCR](http://phpcr.github.io) implementation.
Choose the one that fits your needs and add it to your project, or composer
will  complain that you miss `phpcr/phpcr-implementation`. See
[this article](http://symfony.com/doc/master/cmf/cookbook/database/choosing_phpcr_implementation.html)
for more on choosing your implementation.

## Installation

Assuming you go with jackalope-doctrine-dbal, do:

~~~bash
composer require jackalope/jackalope-doctrine-dbal league/flysystem-phpcr
~~~

## Usage

Bootstrap your PHPCR implementation. If you chose jackalope-doctrine-dbal with sqlite, 
this will look like this for example:

~~~php
use League\Flysystem\Filesystem;
use League\Flysystem\Phpcr\PhpcrAdapter;
use Jackalope\RepositoryFactoryDoctrineDBAL;
use Doctrine\DBAL\Driver\Connection;
use Doctrine\DBAL\DriverManager;

$connection = DriverManager::getConnection([
    'driver' => 'pdo_sqlite',
    'path'   => '/path/to/sqlite.db',
]);
$factory = new RepositoryFactoryDoctrineDBAL();
$repository = $factory->getRepository([
    'jackalope.doctrine_dbal_connection' => $connection,
]);
$session = $repository->login(new SimpleCredentials('', ''));

// this part looks the same regardless of your phpcr implementation.
$root = '/flysystem_tests';
$filesystem = new Filesystem(new PhpcrAdapter($session, $root));
~~~
