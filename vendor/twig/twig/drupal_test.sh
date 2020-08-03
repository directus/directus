#!/bin/bash

set -x
set -e

REPO=`pwd`
cd /tmp
rm -rf drupal-twig-test
composer create-project --no-interaction drupal/recommended-project:9.1.x-dev drupal-twig-test
cd drupal-twig-test
(cd vendor/twig && rm -rf twig && ln -sf $REPO twig)
php ./web/core/scripts/drupal install --no-interaction demo_umami > output
perl -p -i -e 's/^([A-Za-z]+)\: (.+)$/export DRUPAL_\1=\2/' output
source output
#echo '$config["system.logging"]["error_level"] = "verbose";' >> web/sites/default/settings.php

wget https://get.symfony.com/cli/installer -O - | bash
export PATH="$HOME/.symfony/bin:$PATH"
symfony server:start -d --no-tls

curl -OLsS https://get.blackfire.io/blackfire-player.phar
chmod +x blackfire-player.phar
cat > drupal-tests.bkf <<EOF
name "Drupal tests"

scenario
    name "homepage"
    set name "admin"
    set pass "pass"

    visit url('/')
        expect status_code() == 200
    click link('Articles')
        expect status_code() == 200
    click link('Dairy-free and delicious milk chocolate')
        expect body() matches "/Dairy\-free milk chocolate is made in largely the same way as regular chocolate/"
        expect status_code() == 200
    click link('Log in')
        expect status_code() == 200
    submit button("Log in")
        param name name
        param pass pass
        expect status_code() == 303
    follow
        expect status_code() == 200
    click link('Structure')
        expect status_code() == 200
EOF
./blackfire-player.phar run drupal-tests.bkf --endpoint=`symfony var:export SYMFONY_DEFAULT_ROUTE_URL` --variable name=$DRUPAL_Username --variable pass=$DRUPAL_Password
symfony server:stop
