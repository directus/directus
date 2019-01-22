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
 * Includes a template.
 *
 * <pre>
 *   {% include 'header.html' %}
 *     Body
 *   {% include 'footer.html' %}
 * </pre>
 */
class Twig_TokenParser_Include extends Twig_TokenParser
{
    public function parse(Twig_Token $token)
    {
        $expr = $this->parser->getExpressionParser()->parseExpression();

        list($variables, $only, $ignoreMissing) = $this->parseArguments();

        return new Twig_Node_Include($expr, $variables, $only, $ignoreMissing, $token->getLine(), $this->getTag());
    }

    protected function parseArguments()
    {
        $stream = $this->parser->getStream();

        $ignoreMissing = false;
        if ($stream->nextIf(/* Twig_Token::NAME_TYPE */ 5, 'ignore')) {
            $stream->expect(/* Twig_Token::NAME_TYPE */ 5, 'missing');

            $ignoreMissing = true;
        }

        $variables = null;
        if ($stream->nextIf(/* Twig_Token::NAME_TYPE */ 5, 'with')) {
            $variables = $this->parser->getExpressionParser()->parseExpression();
        }

        $only = false;
        if ($stream->nextIf(/* Twig_Token::NAME_TYPE */ 5, 'only')) {
            $only = true;
        }

        $stream->expect(/* Twig_Token::BLOCK_END_TYPE */ 3);

        return [$variables, $only, $ignoreMissing];
    }

    public function getTag()
    {
        return 'include';
    }
}

class_alias('Twig_TokenParser_Include', 'Twig\TokenParser\IncludeTokenParser', false);
