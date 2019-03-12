<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

use Twig\TwigFunction;

/*
 * For Twig 1.x compatibility.
 */
class_exists(TwigFunction::class);

@trigger_error(sprintf('Using the "Twig_SimpleFunction" class is deprecated since Twig version 2.7, use "Twig\TwigFunction" instead.'), E_USER_DEPRECATED);

if (false) {
    /** @deprecated since Twig 2.7, use "Twig\TwigFunction" instead */
    final class Twig_SimpleFunction extends TwigFunction
    {
    }
}
