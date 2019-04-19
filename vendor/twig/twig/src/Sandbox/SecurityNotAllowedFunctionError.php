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
 *
 * @final
 */
class SecurityNotAllowedFunctionError extends SecurityError
{
    private $functionName;

    public function __construct(string $message, string $functionName, int $lineno = -1, string $filename = null, \Exception $previous = null)
    {
        if (-1 !== $lineno) {
            @trigger_error(sprintf('Passing $lineno as a 3th argument of the %s constructor is deprecated since Twig 2.8.1.', __CLASS__), E_USER_DEPRECATED);
        }
        if (null !== $filename) {
            @trigger_error(sprintf('Passing $filename as a 4th argument of the %s constructor is deprecated since Twig 2.8.1.', __CLASS__), E_USER_DEPRECATED);
        }
        if (null !== $previous) {
            @trigger_error(sprintf('Passing $previous as a 5th argument of the %s constructor is deprecated since Twig 2.8.1.', __CLASS__), E_USER_DEPRECATED);
        }
        parent::__construct($message, $lineno, $filename, $previous);
        $this->functionName = $functionName;
    }

    public function getFunctionName()
    {
        return $this->functionName;
    }
}

class_alias('Twig\Sandbox\SecurityNotAllowedFunctionError', 'Twig_Sandbox_SecurityNotAllowedFunctionError');
