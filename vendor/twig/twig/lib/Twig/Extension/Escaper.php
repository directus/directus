<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

final class Twig_Extension_Escaper extends Twig_Extension
{
    private $defaultStrategy;

    /**
     * @param string|false|callable $defaultStrategy An escaping strategy
     *
     * @see setDefaultStrategy()
     */
    public function __construct($defaultStrategy = 'html')
    {
        $this->setDefaultStrategy($defaultStrategy);
    }

    public function getTokenParsers()
    {
        return [new Twig_TokenParser_AutoEscape()];
    }

    public function getNodeVisitors()
    {
        return [new Twig_NodeVisitor_Escaper()];
    }

    public function getFilters()
    {
        return [
            new Twig_Filter('raw', 'twig_raw_filter', ['is_safe' => ['all']]),
        ];
    }

    /**
     * Sets the default strategy to use when not defined by the user.
     *
     * The strategy can be a valid PHP callback that takes the template
     * name as an argument and returns the strategy to use.
     *
     * @param string|false|callable $defaultStrategy An escaping strategy
     */
    public function setDefaultStrategy($defaultStrategy)
    {
        if ('name' === $defaultStrategy) {
            $defaultStrategy = ['Twig_FileExtensionEscapingStrategy', 'guess'];
        }

        $this->defaultStrategy = $defaultStrategy;
    }

    /**
     * Gets the default strategy to use when not defined by the user.
     *
     * @param string $name The template name
     *
     * @return string|false The default strategy to use for the template
     */
    public function getDefaultStrategy($name)
    {
        // disable string callables to avoid calling a function named html or js,
        // or any other upcoming escaping strategy
        if (!is_string($this->defaultStrategy) && false !== $this->defaultStrategy) {
            return call_user_func($this->defaultStrategy, $name);
        }

        return $this->defaultStrategy;
    }
}

/**
 * Marks a variable as being safe.
 *
 * @param string $string A PHP variable
 *
 * @return string
 */
function twig_raw_filter($string)
{
    return $string;
}

class_alias('Twig_Extension_Escaper', 'Twig\Extension\EscaperExtension', false);
