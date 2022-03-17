#!/bin/sh
if [ "$BOOTSTRAP_ENABLED" = true ] ; then
  exec sh -c "npx directus bootstrap && npx directus start"
else
  exec npx directus start
fi
