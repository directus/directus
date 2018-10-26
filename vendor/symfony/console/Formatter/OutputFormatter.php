<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Console\Formatter;

use Symfony\Component\Console\Exception\InvalidArgumentException;

/**
 * Formatter class for console output.
 *
 * @author Konstantin Kudryashov <ever.zet@gmail.com>
 */
class OutputFormatter implements OutputFormatterInterface
{
    private $decorated;
    private $styles = array();
    private $styleStack;

    /**
     * Escapes "<" special char in given text.
     *
     * @param string $text Text to escape
     *
     * @return string Escaped text
     */
    public static function escape($text)
    {
        $text = preg_replace('/([^\\\\]?)</', '$1\\<', $text);

        return self::escapeTrailingBackslash($text);
    }

    /**
     * Escapes trailing "\" in given text.
     *
     * @param string $text Text to escape
     *
     * @return string Escaped text
     *
     * @internal
     */
    public static function escapeTrailingBackslash($text)
    {
        if ('\\' === substr($text, -1)) {
            $len = \strlen($text);
            $text = rtrim($text, '\\');
            $text = str_replace("\0", '', $text);
            $text .= str_repeat("\0", $len - \strlen($text));
        }

        return $text;
    }

    /**
     * Initializes console output formatter.
     *
     * @param bool                            $decorated Whether this formatter should actually decorate strings
     * @param OutputFormatterStyleInterface[] $styles    Array of "name => FormatterStyle" instances
     */
    public function __construct(bool $decorated = false, array $styles = array())
    {
        $this->decorated = $decorated;

        $this->setStyle('error', new OutputFormatterStyle('white', 'red'));
        $this->setStyle('info', new OutputFormatterStyle('green'));
        $this->setStyle('comment', new OutputFormatterStyle('yellow'));
        $this->setStyle('question', new OutputFormatterStyle('black', 'cyan'));

        foreach ($styles as $name => $style) {
            $this->setStyle($name, $style);
        }

        $this->styleStack = new OutputFormatterStyleStack();
    }

    /**
     * {@inheritdoc}
     */
    public function setDecorated($decorated)
    {
        $this->decorated = (bool) $decorated;
    }

    /**
     * {@inheritdoc}
     */
    public function isDecorated()
    {
        return $this->decorated;
    }

    /**
     * {@inheritdoc}
     */
    public function setStyle($name, OutputFormatterStyleInterface $style)
    {
        $this->styles[strtolower($name)] = $style;
    }

    /**
     * {@inheritdoc}
     */
    public function hasStyle($name)
    {
        return isset($this->styles[strtolower($name)]);
    }

    /**
     * {@inheritdoc}
     */
    public function getStyle($name)
    {
        if (!$this->hasStyle($name)) {
            throw new InvalidArgumentException(sprintf('Undefined style: %s', $name));
        }

        return $this->styles[strtolower($name)];
    }

    /**
     * {@inheritdoc}
     */
    public function format($message)
    {
        $message = (string) $message;
        $offset = 0;
        $output = '';
        $tagRegex = '[a-z][a-z0-9,_=;-]*+';
        preg_match_all("#<(($tagRegex) | /($tagRegex)?)>#ix", $message, $matches, PREG_OFFSET_CAPTURE);
        foreach ($matches[0] as $i => $match) {
            $pos = $match[1];
            $text = $match[0];

            if (0 != $pos && '\\' == $message[$pos - 1]) {
                continue;
            }

            // add the text up to the next tag
            $output .= $this->applyCurrentStyle(substr($message, $offset, $pos - $offset));
            $offset = $pos + \strlen($text);

            // opening tag?
            if ($open = '/' != $text[1]) {
                $tag = $matches[1][$i][0];
            } else {
                $tag = isset($matches[3][$i][0]) ? $matches[3][$i][0] : '';
            }

            if (!$open && !$tag) {
                // </>
                $this->styleStack->pop();
            } elseif (false === $style = $this->createStyleFromString(strtolower($tag))) {
                $output .= $this->applyCurrentStyle($text);
            } elseif ($open) {
                $this->styleStack->push($style);
            } else {
                $this->styleStack->pop($style);
            }
        }

        $output .= $this->applyCurrentStyle(substr($message, $offset));

        if (false !== strpos($output, "\0")) {
            return strtr($output, array("\0" => '\\', '\\<' => '<'));
        }

        return str_replace('\\<', '<', $output);
    }

    /**
     * @return OutputFormatterStyleStack
     */
    public function getStyleStack()
    {
        return $this->styleStack;
    }

    /**
     * Tries to create new style instance from string.
     *
     * @return OutputFormatterStyle|false False if string is not format string
     */
    private function createStyleFromString(string $string)
    {
        if (isset($this->styles[$string])) {
            return $this->styles[$string];
        }

        if (!preg_match_all('/([^=]+)=([^;]+)(;|$)/', $string, $matches, PREG_SET_ORDER)) {
            return false;
        }

        $style = new OutputFormatterStyle();
        foreach ($matches as $match) {
            array_shift($match);

            if ('fg' == $match[0]) {
                $style->setForeground($match[1]);
            } elseif ('bg' == $match[0]) {
                $style->setBackground($match[1]);
            } elseif ('options' === $match[0]) {
                preg_match_all('([^,;]+)', $match[1], $options);
                $options = array_shift($options);
                foreach ($options as $option) {
                    $style->setOption($option);
                }
            } else {
                return false;
            }
        }

        return $style;
    }

    /**
     * Applies current style from stack to text, if must be applied.
     */
    private function applyCurrentStyle(string $text): string
    {
        return $this->isDecorated() && \strlen($text) > 0 ? $this->styleStack->getCurrent()->apply($text) : $text;
    }
}
