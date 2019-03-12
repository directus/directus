<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Twig\Extension {
use Twig\FileExtensionEscapingStrategy;
use Twig\NodeVisitor\EscaperNodeVisitor;
use Twig\TokenParser\AutoEscapeTokenParser;
use Twig\TwigFilter;

final class EscaperExtension extends AbstractExtension
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
        return [new AutoEscapeTokenParser()];
    }

    public function getNodeVisitors()
    {
        return [new EscaperNodeVisitor()];
    }

    public function getFilters()
    {
        return [
            new TwigFilter('raw', 'twig_raw_filter', ['is_safe' => ['all']]),
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
            $defaultStrategy = [FileExtensionEscapingStrategy::class, 'guess'];
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
        if (!\is_string($this->defaultStrategy) && false !== $this->defaultStrategy) {
            return \call_user_func($this->defaultStrategy, $name);
        }

        return $this->defaultStrategy;
    }
}

class_alias('Twig\Extension\EscaperExtension', 'Twig_Extension_Escaper');
}

namespace {
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
}
