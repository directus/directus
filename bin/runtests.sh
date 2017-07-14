#!/bin/sh

#
# Command line runner for unit tests for composer projects
# (c) Del 2015 http://www.babel.com.au/
# No Rights Reserved
#

#
# Clean up after any previous test runs
#
mkdir -p documents
rm -rf documents/coverage-html-new
rm -f documents/coverage.xml

#
# Run phpunit
#
vendor/bin/phpunit --coverage-html documents/coverage-html-new --coverage-clover documents/coverage.xml

if [ -d documents/coverage-html-new ]; then
  rm -rf documents/coverage-html
  mv documents/coverage-html-new documents/coverage-html
fi

