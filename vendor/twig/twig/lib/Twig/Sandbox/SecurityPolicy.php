<?php

/*
 * This file is part of Twig.
 *
 * (c) 2009 Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Represents a security policy which need to be enforced when sandbox mode is enabled.
 *
 * @author Fabien Potencier <fabien@symfony.com>
 */
class Twig_Sandbox_SecurityPolicy implements Twig_Sandbox_SecurityPolicyInterface
{
    protected $allowedTags;
    protected $allowedFilters;
    protected $allowedMethods;
    protected $allowedProperties;
    protected $allowedFunctions;

    public function __construct(array $allowedTags = array(), array $allowedFilters = array(), array $allowedMethods = array(), array $allowedProperties = array(), array $allowedFunctions = array())
    {
        $this->allowedTags = $allowedTags;
        $this->allowedFilters = $allowedFilters;
        $this->setAllowedMethods($allowedMethods);
        $this->allowedProperties = $allowedProperties;
        $this->allowedFunctions = $allowedFunctions;
    }

    public function setAllowedTags(array $tags)
    {
        $this->allowedTags = $tags;
    }

    public function setAllowedFilters(array $filters)
    {
        $this->allowedFilters = $filters;
    }

    public function setAllowedMethods(array $methods)
    {
        $this->allowedMethods = array();
        foreach ($methods as $class => $m) {
            $this->allowedMethods[$class] = array_map('strtolower', is_array($m) ? $m : array($m));
        }
    }

    public function setAllowedProperties(array $properties)
    {
        $this->allowedProperties = $properties;
    }

    public function setAllowedFunctions(array $functions)
    {
        $this->allowedFunctions = $functions;
    }

    public function checkSecurity($tags, $filters, $functions)
    {
        foreach ($tags as $tag) {
            if (!in_array($tag, $this->allowedTags)) {
                throw new Twig_Sandbox_SecurityNotAllowedTagError(sprintf('Tag "%s" is not allowed.', $tag), $tag);
            }
        }

        foreach ($filters as $filter) {
            if (!in_array($filter, $this->allowedFilters)) {
                throw new Twig_Sandbox_SecurityNotAllowedFilterError(sprintf('Filter "%s" is not allowed.', $filter), $filter);
            }
        }

        foreach ($functions as $function) {
            if (!in_array($function, $this->allowedFunctions)) {
                throw new Twig_Sandbox_SecurityNotAllowedFunctionError(sprintf('Function "%s" is not allowed.', $function), $function);
            }
        }
    }

    public function checkMethodAllowed($obj, $method)
    {
        if ($obj instanceof Twig_TemplateInterface || $obj instanceof Twig_Markup) {
            return true;
        }

        $allowed = false;
        $method = strtolower($method);
        foreach ($this->allowedMethods as $class => $methods) {
            if ($obj instanceof $class) {
                $allowed = in_array($method, $methods);

                break;
            }
        }

        if (!$allowed) {
            throw new Twig_Sandbox_SecurityError(sprintf('Calling "%s" method on a "%s" object is not allowed.', $method, get_class($obj)));
        }
    }

    public function checkPropertyAllowed($obj, $property)
    {
        $allowed = false;
        foreach ($this->allowedProperties as $class => $properties) {
            if ($obj instanceof $class) {
                $allowed = in_array($property, is_array($properties) ? $properties : array($properties));

                break;
            }
        }

        if (!$allowed) {
            throw new Twig_Sandbox_SecurityError(sprintf('Calling "%s" property on a "%s" object is not allowed.', $property, get_class($obj)));
        }
    }
}
