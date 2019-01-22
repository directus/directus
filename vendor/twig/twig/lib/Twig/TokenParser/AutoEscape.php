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
 * Marks a section of a template to be escaped or not.
 */
final class Twig_TokenParser_AutoEscape extends Twig_TokenParser
{
    public function parse(Twig_Token $token)
    {
        $lineno = $token->getLine();
        $stream = $this->parser->getStream();

        if ($stream->test(/* Twig_Token::BLOCK_END_TYPE */ 3)) {
            $value = 'html';
        } else {
            $expr = $this->parser->getExpressionParser()->parseExpression();
            if (!$expr instanceof Twig_Node_Expression_Constant) {
                throw new Twig_Error_Syntax('An escaping strategy must be a string or false.', $stream->getCurrent()->getLine(), $stream->getSourceContext());
            }
            $value = $expr->getAttribute('value');
        }

        $stream->expect(/* Twig_Token::BLOCK_END_TYPE */ 3);
        $body = $this->parser->subparse([$this, 'decideBlockEnd'], true);
        $stream->expect(/* Twig_Token::BLOCK_END_TYPE */ 3);

        return new Twig_Node_AutoEscape($value, $body, $lineno, $this->getTag());
    }

    public function decideBlockEnd(Twig_Token $token)
    {
        return $token->test('endautoescape');
    }

    public function getTag()
    {
        return 'autoescape';
    }
}

class_alias('Twig_TokenParser_AutoEscape', 'Twig\TokenParser\AutoEscapeTokenParser', false);
