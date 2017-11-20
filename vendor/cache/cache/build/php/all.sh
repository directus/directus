#!/usr/bin/env bash

for SCRIPT in build/php/$TRAVIS_PHP_VERSION/*.sh
do
    echo "Found Script: $SCRIPT"
    if [ -f $SCRIPT -a -x $SCRIPT ]
    then
        echo "Running: $SCRIPT"
        . $SCRIPT
    fi
done