#!/usr/bin/env bash

# Remove all vendor dirs
ROOT=$(pwd)

# Run for each components
find src -mindepth 2 -type f -name composer.json | while read line; do
   # Save the directory name
   DIR=$(dirname $line)

   if [[ ! -z  $DIR ]]; then
     # Remove vendors
     rm -rf "$DIR/vendor"
   fi

done
