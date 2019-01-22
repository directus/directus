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
 * Represents a template test.
 *
 * @final since version 2.4.0
 *
 * @author Fabien Potencier <fabien@symfony.com>
 *
 * @see https://twig.symfony.com/doc/templates.html#test-operator
 */
class Twig_Test
{
    private $name;
    private $callable;
    private $options;
    private $arguments = [];

    /**
     * Creates a template test.
     *
     * @param string        $name     Name of this test
     * @param callable|null $callable A callable implementing the test. If null, you need to overwrite the "node_class" option to customize compilation.
     * @param array         $options  Options array
     */
    public function __construct(string $name, $callable = null, array $options = [])
    {
        if (__CLASS__ !== get_class($this)) {
            @trigger_error('Overriding '.__CLASS__.' is deprecated since version 2.4.0 and the class will be final in 3.0.', E_USER_DEPRECATED);
        }

        $this->name = $name;
        $this->callable = $callable;
        $this->options = array_merge([
            'is_variadic' => false,
            'node_class' => 'Twig_Node_Expression_Test',
            'deprecated' => false,
            'alternative' => null,
        ], $options);
    }

    public function getName()
    {
        return $this->name;
    }

    /**
     * Returns the callable to execute for this test.
     *
     * @return callable|null
     */
    public function getCallable()
    {
        return $this->callable;
    }

    public function getNodeClass()
    {
        return $this->options['node_class'];
    }

    public function setArguments($arguments)
    {
        $this->arguments = $arguments;
    }

    public function getArguments()
    {
        return $this->arguments;
    }

    public function isVariadic()
    {
        return $this->options['is_variadic'];
    }

    public function isDeprecated()
    {
        return (bool) $this->options['deprecated'];
    }

    public function getDeprecatedVersion()
    {
        return $this->options['deprecated'];
    }

    public function getAlternative()
    {
        return $this->options['alternative'];
    }
}

// For Twig 1.x compatibility
class_alias('Twig_Test', 'Twig_SimpleTest', false);

class_alias('Twig_Test', 'Twig\TwigTest', false);
