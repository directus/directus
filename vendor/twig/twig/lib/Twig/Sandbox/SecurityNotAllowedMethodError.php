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
 * Exception thrown when a not allowed class method is used in a template.
 *
 * @author Kit Burton-Senior <mail@kitbs.com>
 */
class Twig_Sandbox_SecurityNotAllowedMethodError extends Twig_Sandbox_SecurityError
{
    private $className;
    private $methodName;

    public function __construct($message, $className, $methodName, $lineno = -1, $filename = null, Exception $previous = null)
    {
        parent::__construct($message, $lineno, $filename, $previous);
        $this->className = $className;
        $this->methodName = $methodName;
    }

    public function getClassName()
    {
        return $this->className;
    }

    public function getMethodName()
    {
        return $this->methodName;
    }
}
