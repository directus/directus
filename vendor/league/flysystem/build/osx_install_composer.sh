#!/usr/bin/env bash
php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
sudo php composer-setup.php --install-dir=/usr/local/bin/ --filename=composer
rm composer-setup.php
