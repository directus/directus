<?php
/*
 * This file is part of PHPUnit.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

use SebastianBergmann\Diff\Differ;

/**
 * ...
 */
class PHPUnit_Framework_Constraint_StringMatches extends PHPUnit_Framework_Constraint_PCREMatch
{
    /**
     * @var string
     */
    protected $string;

    /**
     * @param string $string
     */
    public function __construct($string)
    {
        parent::__construct($string);

        $this->pattern = $this->createPatternFromFormat(
            preg_replace('/\r\n/', "\n", $string)
        );

        $this->string = $string;
    }

    protected function failureDescription($other)
    {
        return 'format description matches text';
    }

    protected function additionalFailureDescription($other)
    {
        $from = preg_split('(\r\n|\r|\n)', $this->string);
        $to   = preg_split('(\r\n|\r|\n)', $other);

        foreach ($from as $index => $line) {
            if (isset($to[$index]) && $line !== $to[$index]) {
                $line = $this->createPatternFromFormat($line);

                if (preg_match($line, $to[$index]) > 0) {
                    $from[$index] = $to[$index];
                }
            }
        }

        $this->string = implode("\n", $from);
        $other        = implode("\n", $to);

        $differ = new Differ("--- Expected\n+++ Actual\n");

        return $differ->diff($this->string, $other);
    }

    protected function createPatternFromFormat($string)
    {
        $string = str_replace(
            [
            '%e',
            '%s',
            '%S',
            '%a',
            '%A',
            '%w',
            '%i',
            '%d',
            '%x',
            '%f',
            '%c'
            ],
            [
            '\\' . DIRECTORY_SEPARATOR,
            '[^\r\n]+',
            '[^\r\n]*',
            '.+',
            '.*',
            '\s*',
            '[+-]?\d+',
            '\d+',
            '[0-9a-fA-F]+',
            '[+-]?\.?\d+\.?\d*(?:[Ee][+-]?\d+)?',
            '.'
            ],
            preg_quote($string, '/')
        );

        return '/^' . $string . '$/s';
    }
}
