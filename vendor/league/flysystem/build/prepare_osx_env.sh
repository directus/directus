#!/usr/bin/env bash

echo "Here's the OSX environment:"
sw_vers
brew --version

echo "Updating brew..."
brew update

if [[ "${_PHP}" == "hhvm" ]]; then
    echo "Adding brew HHVM dependencies..."
    brew tap hhvm/hhvm

else
    echo "Adding brew PHP dependencies..."
    brew tap homebrew/dupes
    brew tap homebrew/versions
    brew tap homebrew/homebrew-php
fi
