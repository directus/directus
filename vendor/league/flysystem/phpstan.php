<?php
if (PHP_VERSION_ID < 70100) {
    echo "To use PHPStan, PHP version must be 7.1 or higher";
    exit(0);
}

$phpstanURL = 'https://raw.githubusercontent.com/phpstan/phpstan-shim/0.11.8/phpstan.phar';

if (file_exists('./phpstan.phar') === false) {
    echo "phpstan.phar doesn't exist, downloading from $phpstanURL\n";
    $phpstanFile = fopen($phpstanURL, 'rb');
    file_put_contents('./phpstan.phar', $phpstanFile);
    chmod('./phpstan.phar', 0755);
    fclose($phpstanFile);
}

$exec = './phpstan.phar analyse -a vendor/autoload.php -l 5 src';
echo $exec . "\n";
passthru($exec);
