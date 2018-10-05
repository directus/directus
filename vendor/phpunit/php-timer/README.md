[![Build Status](https://travis-ci.org/sebastianbergmann/php-timer.svg?branch=master)](https://travis-ci.org/sebastianbergmann/php-timer)

# PHP_Timer

Utility class for timing things, factored out of PHPUnit into a stand-alone component.

## Installation

You can add this library as a local, per-project dependency to your project using [Composer](https://getcomposer.org/):

    composer require phpunit/php-timer

If you only need this library during development, for instance to run your project's test suite, then you should add it as a development-time dependency:

    composer require --dev phpunit/php-timer

## Usage

### Basic Timing

```php
PHP_Timer::start();

// ...

$time = PHP_Timer::stop();
var_dump($time);

print PHP_Timer::secondsToTimeString($time);
```

The code above yields the output below:

    double(1.0967254638672E-5)
    0 ms

### Resource Consumption Since PHP Startup

```php
print PHP_Timer::resourceUsage();
```

The code above yields the output below:

    Time: 0 ms, Memory: 0.50MB
