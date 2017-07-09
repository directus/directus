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
 * Interface implemented by token parsers.
 *
 * @author Fabien Potencier <fabien@symfony.com>
 */
interface Twig_TokenParserInterface
{
    /**
     * Sets the parser associated with this token parser.
     */
    public function setParser(Twig_Parser $parser);

    /**
     * Parses a token and returns a node.
     *
     * @return Twig_NodeInterface
     *
     * @throws Twig_Error_Syntax
     */
    public function parse(Twig_Token $token);

    /**
     * Gets the tag name associated with this token parser.
     *
     * @return string The tag name
     */
    public function getTag();
}

class_alias('Twig_TokenParserInterface', 'Twig\TokenParser\TokenParserInterface', false);
class_exists('Twig_Parser');
class_exists('Twig_Token');
