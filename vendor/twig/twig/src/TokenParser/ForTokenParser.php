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

namespace Twig\TokenParser;

use Twig\Node\Expression\AssignNameExpression;
use Twig\Node\ForNode;
use Twig\Node\Node;
use Twig\Token;

/**
 * Loops over each item of a sequence.
 *
 *   <ul>
 *    {% for user in users %}
 *      <li>{{ user.username|e }}</li>
 *    {% endfor %}
 *   </ul>
 */
final class ForTokenParser extends AbstractTokenParser
{
    public function parse(Token $token): Node
    {
        $lineno = $token->getLine();
        $stream = $this->parser->getStream();
        $targets = $this->parser->getExpressionParser()->parseAssignmentExpression();
        $stream->expect(/* Token::OPERATOR_TYPE */ 8, 'in');
        $seq = $this->parser->getExpressionParser()->parseExpression();

        $stream->expect(/* Token::BLOCK_END_TYPE */ 3);
        $body = $this->parser->subparse([$this, 'decideForFork']);
        if ('else' == $stream->next()->getValue()) {
            $stream->expect(/* Token::BLOCK_END_TYPE */ 3);
            $else = $this->parser->subparse([$this, 'decideForEnd'], true);
        } else {
            $else = null;
        }
        $stream->expect(/* Token::BLOCK_END_TYPE */ 3);

        if (\count($targets) > 1) {
            $keyTarget = $targets->getNode(0);
            $keyTarget = new AssignNameExpression($keyTarget->getAttribute('name'), $keyTarget->getTemplateLine());
            $valueTarget = $targets->getNode(1);
            $valueTarget = new AssignNameExpression($valueTarget->getAttribute('name'), $valueTarget->getTemplateLine());
        } else {
            $keyTarget = new AssignNameExpression('_key', $lineno);
            $valueTarget = $targets->getNode(0);
            $valueTarget = new AssignNameExpression($valueTarget->getAttribute('name'), $valueTarget->getTemplateLine());
        }

        return new ForNode($keyTarget, $valueTarget, $seq, null, $body, $else, $lineno, $this->getTag());
    }

    public function decideForFork(Token $token): bool
    {
        return $token->test(['else', 'endfor']);
    }

    public function decideForEnd(Token $token): bool
    {
        return $token->test('endfor');
    }

    public function getTag(): string
    {
        return 'for';
    }
}
