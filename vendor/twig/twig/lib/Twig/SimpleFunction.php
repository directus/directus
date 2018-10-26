<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * For Twig 1.x compatibility.
 */
class_exists('Twig_Function');

if (false) {
    final class Twig_SimpleFunction extends Twig_Function
    {
    }
}
