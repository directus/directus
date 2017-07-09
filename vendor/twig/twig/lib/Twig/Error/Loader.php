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
 * Exception thrown when an error occurs during template loading.
 *
 * Automatic template information guessing is always turned off as
 * if a template cannot be loaded, there is nothing to guess.
 * However, when a template is loaded from another one, then, we need
 * to find the current context and this is automatically done by
 * Twig_Template::displayWithErrorHandling().
 *
 * This strategy makes Twig_Environment::resolveTemplate() much faster.
 *
 * @author Fabien Potencier <fabien@symfony.com>
 */
class Twig_Error_Loader extends Twig_Error
{
    public function __construct($message, $lineno = -1, $source = null, Exception $previous = null)
    {
        if (PHP_VERSION_ID < 50300) {
            $this->previous = $previous;
            Exception::__construct('');
        } else {
            Exception::__construct('', 0, $previous);
        }
        $this->appendMessage($message);
        $this->setTemplateLine(false);
    }
}

class_alias('Twig_Error_Loader', 'Twig\Error\LoaderError', false);
