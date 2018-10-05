# Contributing to PHPUnit

## Contributor Code of Conduct

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.

## Workflow

* Fork the project.
* Make your bug fix or feature addition.
* Add tests for it. This is important so we don't break it in a future version unintentionally.
* Send a pull request. Bonus points for topic branches.

Please make sure that you have [set up your user name and email address](http://git-scm.com/book/en/v2/Getting-Started-First-Time-Git-Setup) for use with Git. Strings such as `silly nick name <root@localhost>` look really stupid in the commit history of a project.

Pull requests for bug fixes must be based on the current stable branch whereas pull requests for new features must be based on the `master` branch.

We are trying to keep backwards compatibility breaks in PHPUnit to an absolute minimum. Please take this into account when proposing changes.

Due to time constraints, we are not always able to respond as quickly as we would like. Please do not take delays personal and feel free to remind us if you feel that we forgot to respond.

## Coding Guidelines

This project comes with a configuration file for [php-cs-fixer](https://github.com/FriendsOfPHP/PHP-CS-Fixer) (`.php_cs`) that you can use to (re)format your sourcecode for compliance with this project's coding guidelines:

```bash
$ wget http://cs.sensiolabs.org/download/php-cs-fixer-v2.phar -O php-cs-fixer.phar

$ php php-cs-fixer.phar fix
```

## Using PHPUnit from a Git checkout

The following commands can be used to perform the initial checkout of PHPUnit:

```bash
$ git clone git://github.com/sebastianbergmann/phpunit.git

$ cd phpunit
```

Retrieve PHPUnit's dependencies using [Composer](https://getcomposer.org/):

```bash
$ composer install
```

The `phpunit` script can be used to invoke the PHPUnit test runner:

```bash
$ ./phpunit --version
```

## Running PHPUnit's own test suite

After following the steps shown above, PHPUnit's own test suite is run like this:

```bash
$ ./phpunit
```

## Reporting issues

Please use the most specific issue tracker to search for existing tickets and to open new tickets:

* [General problems](https://github.com/sebastianbergmann/phpunit/issues)
* [Code Coverage](https://github.com/sebastianbergmann/php-code-coverage/issues)
* [Stub and Mock Objects](https://github.com/sebastianbergmann/phpunit-mock-objects/issues)
* [DbUnit](https://github.com/sebastianbergmann/dbunit/issues)
* [Documentation](https://github.com/sebastianbergmann/phpunit-documentation/issues)
* [Website](https://github.com/sebastianbergmann/phpunit-website/issues)

