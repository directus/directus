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
 * Exception thrown when a not allowed function is used in a template.
 *
 * @author Martin Hasoň <martin.hason@gmail.com>
 */
class Twig_Sandbox_SecurityNotAllowedFunctionError extends Twig_Sandbox_SecurityError
{
    private $functionName;

    public function __construct($message, $functionName, $lineno = -1, $filename = null, Exception $previous = null)
    {
        parent::__construct($message, $lineno, $filename, $previous);
        $this->functionName = $functionName;
    }

    public function getFunctionName()
    {
        return $this->functionName;
    }
}
