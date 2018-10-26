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
 * Exception thrown when a security error occurs at runtime.
 *
 * @author Fabien Potencier <fabien@symfony.com>
 */
class Twig_Sandbox_SecurityError extends Twig_Error
{
}

class_alias('Twig_Sandbox_SecurityError', 'Twig\Sandbox\SecurityError', false);
