#!/usr/bin/env bash

if [ $# -eq 0 ]
then
    echo "No arguments supplied. You need to specify the version to composer."
    exit 1
fi

VERSION=$1
ROOT=$(pwd)

# Run for each components
find src -mindepth 2 -type f -name phpunit.xml.dist | while read line; do
   # Save the directory name
   DIR=$(dirname $line)

   # Go to that directory
   cd $DIR
   pwd

   if [[ "$DIR" != "src/Bridge/Doctrine" && "$DIR" != "src/Hierarchy" && "$DIR" != "src/Namespaced" && "$DIR" != "src/SessionHandler" ]]; then
     # Let composer update the composer.json
     composer require --dev --no-update cache/integration-tests:$VERSION
   fi

   # Go back to the root
   cd $ROOT
   echo ""
done

# Update integration test for the root
pwd
composer require --dev --no-update cache/integration-tests:$VERSION
