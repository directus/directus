<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 * (c) Armin Ronacher
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Exception thrown when an error occurs at runtime.
 *
 * @author Fabien Potencier <fabien@symfony.com>
 */
class Twig_Error_Runtime extends Twig_Error
{
}

class_alias('Twig_Error_Runtime', 'Twig\Error\RuntimeError', false);
