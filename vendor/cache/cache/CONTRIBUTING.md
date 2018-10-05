# Contribute to PHP-Cache*

Thank you for contributing to PHP-Cache!

Before we can merge your Pull-Request here are some guidelines that you need to follow.
These guidelines exist not to annoy you, but to keep the code base clean,
unified and future proof.

## We only accept PRs  to "master"

Our branching strategy is "everything to master first", even
bugfixes and we then merge them into the stable branches. You should only 
open pull requests against the master branch. Otherwise we cannot accept the PR.

There is one exception to the rule, when we merged a bug into some stable branches
we do occasionally accept pull requests that merge the same bug fix into earlier
branches.

## Coding Standard

We use PSR-1 and PSR-2:

* https://github.com/php-fig/fig-standards/blob/master/accepted/PSR-1-basic-coding-standard.md
* https://github.com/php-fig/fig-standards/blob/master/accepted/PSR-2-coding-style-guide.md

with some exceptions/differences:

* Keep the nesting of control structures per method as small as possible
* Align equals (=) signs
* Prefer early exit over nesting conditions

All pull requests will end up getting run through Style CI, which is required to pass.

## Unit-Tests

Please try to add a test for your pull-request.

* If your test is specific for an adapter/library, put it in the library tests.
* If it is adapter agnostic, put it in the src/IntegrationTests directory

You can run the unit-tests by calling `composer test` from the root of the project.
It will run all the tests for each library.

In order to do that, you will need a fresh copy of php-cache/cache, and you
will have to run a composer installation in the project:

```sh
git clone git@github.com:php-cache/cache.git
cd cache
curl -sS https://getcomposer.org/installer | php --
./composer.phar install
```

## Travis

We automatically run your pull request through [Travis CI](http://www.travis-ci.org)
against on all of the adapters. If you break the tests, we cannot merge your code,
so please make sure that your code is working before opening up a Pull-Request.

## Getting merged

Please allow us time to review your pull requests. We will give our best to review
everything as fast as possible, but cannot always live up to our own expectations.

Thank you very much again for your contribution!

\* Any similarities to the Doctrine contributing file is NOT coincidence. We've used their CONTRIBUTING.md file as a basis for ours :)

