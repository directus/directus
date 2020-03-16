<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

use Twig\TwigTest;

/*
 * For Twig 1.x compatibility.
 */
class_exists(TwigTest::class);

@trigger_error(sprintf('Using the "Twig_SimpleTest" class is deprecated since Twig version 2.7, use "Twig\TwigTest" instead.'), E_USER_DEPRECATED);

if (false) {
    /** @deprecated since Twig 2.7, use "Twig\TwigTest" instead */
    final class Twig_SimpleTest extends TwigTest
    {
    }
}
