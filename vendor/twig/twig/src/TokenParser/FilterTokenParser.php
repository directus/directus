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

use Twig\Node\BlockNode;
use Twig\Node\Expression\BlockReferenceExpression;
use Twig\Node\Expression\ConstantExpression;
use Twig\Node\PrintNode;
use Twig\Token;

/**
 * Filters a section of a template by applying filters.
 *
 *   {% filter upper %}
 *      This text becomes uppercase
 *   {% endfilter %}
 */
final class FilterTokenParser extends AbstractTokenParser
{
    public function parse(Token $token)
    {
        $name = $this->parser->getVarName();
        $ref = new BlockReferenceExpression(new ConstantExpression($name, $token->getLine()), null, $token->getLine(), $this->getTag());

        $filter = $this->parser->getExpressionParser()->parseFilterExpressionRaw($ref, $this->getTag());
        $this->parser->getStream()->expect(/* Token::BLOCK_END_TYPE */ 3);

        $body = $this->parser->subparse([$this, 'decideBlockEnd'], true);
        $this->parser->getStream()->expect(/* Token::BLOCK_END_TYPE */ 3);

        $block = new BlockNode($name, $body, $token->getLine());
        $this->parser->setBlock($name, $block);

        return new PrintNode($filter, $token->getLine(), $this->getTag());
    }

    public function decideBlockEnd(Token $token)
    {
        return $token->test('endfilter');
    }

    public function getTag()
    {
        return 'filter';
    }
}

class_alias('Twig\TokenParser\FilterTokenParser', 'Twig_TokenParser_Filter');
