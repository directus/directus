<?php

declare(strict_types=1);

namespace GraphQL\Utils;

use function array_pop;
use function array_shift;
use function count;
use function implode;
use function mb_strlen;
use function mb_substr;
use function preg_split;
use function trim;

class BlockString
{
    /**
     * Produces the value of a block string from its parsed raw value, similar to
     * Coffeescript's block string, Python's docstring trim or Ruby's strip_heredoc.
     *
     * This implements the GraphQL spec's BlockStringValue() static algorithm.
     */
    public static function value($rawString)
    {
        // Expand a block string's raw value into independent lines.
        $lines = preg_split("/\\r\\n|[\\n\\r]/", $rawString);

        // Remove common indentation from all lines but first.
        $commonIndent = null;
        $linesLength  = count($lines);

        for ($i = 1; $i < $linesLength; $i++) {
            $line   = $lines[$i];
            $indent = self::leadingWhitespace($line);

            if ($indent >= mb_strlen($line) ||
                ($commonIndent !== null && $indent >= $commonIndent)
            ) {
                continue;
            }

            $commonIndent = $indent;
            if ($commonIndent === 0) {
                break;
            }
        }

        if ($commonIndent) {
            for ($i = 1; $i < $linesLength; $i++) {
                $line      = $lines[$i];
                $lines[$i] = mb_substr($line, $commonIndent);
            }
        }

        // Remove leading and trailing blank lines.
        while (count($lines) > 0 && trim($lines[0], " \t") === '') {
            array_shift($lines);
        }
        while (count($lines) > 0 && trim($lines[count($lines) - 1], " \t") === '') {
            array_pop($lines);
        }

        // Return a string of the lines joined with U+000A.
        return implode("\n", $lines);
    }

    private static function leadingWhitespace($str)
    {
        $i = 0;
        while ($i < mb_strlen($str) && ($str[$i] === ' ' || $str[$i] === '\t')) {
            $i++;
        }

        return $i;
    }
}
