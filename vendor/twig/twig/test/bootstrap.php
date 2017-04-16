<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

if (PHP_VERSION_ID < 50300) {
    require_once dirname(__FILE__).'/../lib/Twig/Autoloader.php';
    Twig_Autoloader::register(true);
} else {
    require __DIR__.'/../vendor/autoload.php';

    if (!class_exists('\PHPUnit_Framework_TestCase') && class_exists('\PHPUnit\Framework\TestCase')) {
        class_alias('\PHPUnit\Framework\TestCase', '\PHPUnit_Framework_TestCase');
    }
}
