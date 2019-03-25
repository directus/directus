<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Twig\Sandbox;

/**
 * Exception thrown when a not allowed function is used in a template.
 *
 * @author Martin Hasoň <martin.hason@gmail.com>
 */
class SecurityNotAllowedFunctionError extends SecurityError
{
    private $functionName;

    public function __construct(string $message, string $functionName, int $lineno = -1, string $filename = null, \Exception $previous = null)
    {
        parent::__construct($message, $lineno, $filename, $previous);
        $this->functionName = $functionName;
    }

    public function getFunctionName()
    {
        return $this->functionName;
    }
}

class_alias('Twig\Sandbox\SecurityNotAllowedFunctionError', 'Twig_Sandbox_SecurityNotAllowedFunctionError');
