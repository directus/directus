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
 * Imports macros.
 *
 * <pre>
 *   {% from 'forms.html' import forms %}
 * </pre>
 */
final class Twig_TokenParser_From extends Twig_TokenParser
{
    public function parse(Twig_Token $token)
    {
        $macro = $this->parser->getExpressionParser()->parseExpression();
        $stream = $this->parser->getStream();
        $stream->expect('import');

        $targets = array();
        do {
            $name = $stream->expect(/* Twig_Token::NAME_TYPE */ 5)->getValue();

            $alias = $name;
            if ($stream->nextIf('as')) {
                $alias = $stream->expect(/* Twig_Token::NAME_TYPE */ 5)->getValue();
            }

            $targets[$name] = $alias;

            if (!$stream->nextIf(/* Twig_Token::PUNCTUATION_TYPE */ 9, ',')) {
                break;
            }
        } while (true);

        $stream->expect(/* Twig_Token::BLOCK_END_TYPE */ 3);

        $node = new Twig_Node_Import($macro, new Twig_Node_Expression_AssignName($this->parser->getVarName(), $token->getLine()), $token->getLine(), $this->getTag());

        foreach ($targets as $name => $alias) {
            $this->parser->addImportedSymbol('function', $alias, 'macro_'.$name, $node->getNode('var'));
        }

        return $node;
    }

    public function getTag()
    {
        return 'from';
    }
}

class_alias('Twig_TokenParser_From', 'Twig\TokenParser\FromTokenParser', false);
