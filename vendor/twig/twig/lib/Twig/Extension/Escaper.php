<?php

/*
 * This file is part of Twig.
 *
 * (c) 2009 Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
class Twig_Extension_Escaper extends Twig_Extension
{
    protected $defaultStrategy;

    /**
     * Constructor.
     *
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
        return array(new Twig_TokenParser_AutoEscape());
    }

    public function getNodeVisitors()
    {
        return array(new Twig_NodeVisitor_Escaper());
    }

    public function getFilters()
    {
        return array(
            new Twig_SimpleFilter('raw', 'twig_raw_filter', array('is_safe' => array('all'))),
        );
    }

    /**
     * Sets the default strategy to use when not defined by the user.
     *
     * The strategy can be a valid PHP callback that takes the template
     * "filename" as an argument and returns the strategy to use.
     *
     * @param string|false|callable $defaultStrategy An escaping strategy
     */
    public function setDefaultStrategy($defaultStrategy)
    {
        // for BC
        if (true === $defaultStrategy) {
            @trigger_error('Using "true" as the default strategy is deprecated since version 1.21. Use "html" instead.', E_USER_DEPRECATED);

            $defaultStrategy = 'html';
        }

        if ('filename' === $defaultStrategy) {
            $defaultStrategy = array('Twig_FileExtensionEscapingStrategy', 'guess');
        }

        $this->defaultStrategy = $defaultStrategy;
    }

    /**
     * Gets the default strategy to use when not defined by the user.
     *
     * @param string $filename The template "filename"
     *
     * @return string|false The default strategy to use for the template
     */
    public function getDefaultStrategy($filename)
    {
        // disable string callables to avoid calling a function named html or js,
        // or any other upcoming escaping strategy
        if (!is_string($this->defaultStrategy) && false !== $this->defaultStrategy) {
            return call_user_func($this->defaultStrategy, $filename);
        }

        return $this->defaultStrategy;
    }

    public function getName()
    {
        return 'escaper';
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
