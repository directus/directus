language: php

sudo: false

install:
  - travis_retry composer install --no-interaction --prefer-source

script: ./vendor/bin/phpunit --configuration ./build/travis-ci.xml

php:
  - 5.3.3
  - 5.3
  - 5.4
  - 5.5
  - 5.6
  - hhvm

notifications:
  email: false
  webhooks:
    urls:
      - https://webhooks.gitter.im/e/6668f52f3dd4e3f81960
    on_success: always
    on_failure: always
    on_start: false
