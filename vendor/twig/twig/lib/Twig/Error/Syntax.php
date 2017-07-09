<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 * (c) Armin Ronacher
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Exception thrown when a syntax error occurs during lexing or parsing of a template.
 *
 * @author Fabien Potencier <fabien@symfony.com>
 */
class Twig_Error_Syntax extends Twig_Error
{
    /**
     * Tweaks the error message to include suggestions.
     *
     * @param string $name  The original name of the item that does not exist
     * @param array  $items An array of possible items
     */
    public function addSuggestions($name, array $items)
    {
        if (!$alternatives = self::computeAlternatives($name, $items)) {
            return;
        }

        $this->appendMessage(sprintf(' Did you mean "%s"?', implode('", "', $alternatives)));
    }

    /**
     * @internal
     *
     * To be merged with the addSuggestions() method in 2.0.
     */
    public static function computeAlternatives($name, $items)
    {
        $alternatives = array();
        foreach ($items as $item) {
            $lev = levenshtein($name, $item);
            if ($lev <= strlen($name) / 3 || false !== strpos($item, $name)) {
                $alternatives[$item] = $lev;
            }
        }
        asort($alternatives);

        return array_keys($alternatives);
    }
}

class_alias('Twig_Error_Syntax', 'Twig\Error\SyntaxError', false);
