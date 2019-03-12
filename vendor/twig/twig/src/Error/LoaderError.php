<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Twig\Error;

/**
 * Exception thrown when an error occurs during template loading.
 *
 * Automatic template information guessing is always turned off as
 * if a template cannot be loaded, there is nothing to guess.
 * However, when a template is loaded from another one, then, we need
 * to find the current context and this is automatically done by
 * Twig\Template::displayWithErrorHandling().
 *
 * This strategy makes Twig\Environment::resolveTemplate() much faster.
 *
 * @author Fabien Potencier <fabien@symfony.com>
 */
class LoaderError extends Error
{
    public function __construct($message, $lineno = -1, $source = null, \Exception $previous = null)
    {
        parent::__construct($message, $lineno, $source, $previous, false);
    }
}

class_alias('Twig\Error\LoaderError', 'Twig_Error_Loader');
