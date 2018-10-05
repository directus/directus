FROM php:7.1-apache

# Change DocumentRoot path
RUN sed -i 's#/var/www/html#'/var/www/html/public'#g' /etc/apache2/sites-available/000-default.conf

# Install needed packages
RUN apt-get update && \
    apt-get install -y \
    git \
    zip \
    libpng-dev \
    libmagickwand-dev \
    --no-install-recommends \
      && pecl install imagick \
      && docker-php-ext-enable imagick \
        && rm -r /var/lib/apt/lists/*

# Configure PHP extentions
 RUN docker-php-ext-configure \
   gd --with-freetype-dir=/usr/include/ --with-jpeg-dir=/usr/include/

# Install PHP Extensions
RUN docker-php-ext-install pdo_mysql mbstring gd

RUN a2enmod rewrite
