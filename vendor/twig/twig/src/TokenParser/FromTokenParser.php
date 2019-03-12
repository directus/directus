<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Twig\TokenParser;

use Twig\Node\Expression\AssignNameExpression;
use Twig\Node\ImportNode;
use Twig\Token;

/**
 * Imports macros.
 *
 *   {% from 'forms.html' import forms %}
 */
final class FromTokenParser extends AbstractTokenParser
{
    public function parse(Token $token)
    {
        $macro = $this->parser->getExpressionParser()->parseExpression();
        $stream = $this->parser->getStream();
        $stream->expect('import');

        $targets = [];
        do {
            $name = $stream->expect(/* Token::NAME_TYPE */ 5)->getValue();

            $alias = $name;
            if ($stream->nextIf('as')) {
                $alias = $stream->expect(/* Token::NAME_TYPE */ 5)->getValue();
            }

            $targets[$name] = $alias;

            if (!$stream->nextIf(/* Token::PUNCTUATION_TYPE */ 9, ',')) {
                break;
            }
        } while (true);

        $stream->expect(/* Token::BLOCK_END_TYPE */ 3);

        $node = new ImportNode($macro, new AssignNameExpression($this->parser->getVarName(), $token->getLine()), $token->getLine(), $this->getTag());

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

class_alias('Twig\TokenParser\FromTokenParser', 'Twig_TokenParser_From');
