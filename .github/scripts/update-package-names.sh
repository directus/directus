#!/usr/bin/env bash

# Usage: ./update-package-names.sh zjpiazza
# Will update all package.json "name" fields in packages/ to "@zjpiazza/<package>"

set -e

SCOPE="$1"
if [ -z "$SCOPE" ]; then
  echo "Usage: $0 <scope>"
  exit 1
fi

find packages -mindepth 2 -maxdepth 2 -name package.json | while read pkg; do
  PKG_NAME=$(basename "$(dirname "$pkg")")
  if [[ "$PKG_NAME" == create-directus* ]]; then
    NEW_NAME="@$SCOPE/$PKG_NAME"
  else
    NEW_NAME="@$SCOPE/directus-$PKG_NAME"
  fi
  echo "Updating $pkg: -> $NEW_NAME"
  
  # Update package name and repository URL
  jq ".name = \"$NEW_NAME\" | .repository.url = \"https://github.com/$SCOPE/directus.git\"" "$pkg" > "$pkg.tmp" && mv "$pkg.tmp" "$pkg"
done