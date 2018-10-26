# Environment

This component provides functionality that helps writing PHP code that has runtime-specific (PHP / HHVM) execution paths.

[![Latest Stable Version](https://poser.pugx.org/sebastian/environment/v/stable.png)](https://packagist.org/packages/sebastian/environment)
[![Build Status](https://travis-ci.org/sebastianbergmann/environment.png?branch=master)](https://travis-ci.org/sebastianbergmann/environment)

## Installation

You can add this library as a local, per-project dependency to your project using [Composer](https://getcomposer.org/):

    composer require sebastian/environment

If you only need this library during development, for instance to run your project's test suite, then you should add it as a development-time dependency:

    composer require --dev sebastian/environment

## Usage

```php
<?php
use SebastianBergmann\Environment\Runtime;

$runtime = new Runtime;

var_dump($runtime->getNameWithVersion());
var_dump($runtime->getName());
var_dump($runtime->getVersion());
var_dump($runtime->getBinary());
var_dump($runtime->isHHVM());
var_dump($runtime->isPHP());
var_dump($runtime->hasXdebug());
var_dump($runtime->canCollectCodeCoverage());
```

### Output on PHP

    $ php --version
    PHP 5.5.8 (cli) (built: Jan  9 2014 08:33:30)
    Copyright (c) 1997-2013 The PHP Group
    Zend Engine v2.5.0, Copyright (c) 1998-2013 Zend Technologies
        with Xdebug v2.2.3, Copyright (c) 2002-2013, by Derick Rethans


    $ php example.php
    string(9) "PHP 5.5.8"
    string(3) "PHP"
    string(5) "5.5.8"
    string(14) "'/usr/bin/php'"
    bool(false)
    bool(true)
    bool(true)
    bool(true)

### Output on HHVM

    $ hhvm --version
    HipHop VM 2.4.0-dev (rel)
    Compiler: heads/master-0-ga98e57cabee7e7f0d14493ab17d5c7ab0157eb98
    Repo schema: 8d6e69287c41c1f09bb4d327421720d1922cfc67


    $ hhvm example.php
    string(14) "HHVM 2.4.0-dev"
    string(4) "HHVM"
    string(9) "2.4.0-dev"
    string(42) "'/usr/local/src/hhvm/hphp/hhvm/hhvm' --php"
    bool(true)
    bool(false)
    bool(false)
    bool(true)

