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
 * Exception thrown when a not allowed class property is used in a template.
 *
 * @author Kit Burton-Senior <mail@kitbs.com>
 */
final class SecurityNotAllowedPropertyError extends SecurityError
{
    private $className;
    private $propertyName;

    public function __construct(string $message, string $className, string $propertyName)
    {
        parent::__construct($message);
        $this->className = $className;
        $this->propertyName = $propertyName;
    }

    public function getClassName(): string
    {
        return $this->className;
    }

    public function getPropertyName()
    {
        return $this->propertyName;
    }
}
