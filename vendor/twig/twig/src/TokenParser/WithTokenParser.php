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

use Twig\Node\WithNode;
use Twig\Token;

/**
 * Creates a nested scope.
 *
 * @author Fabien Potencier <fabien@symfony.com>
 */
final class WithTokenParser extends AbstractTokenParser
{
    public function parse(Token $token)
    {
        $stream = $this->parser->getStream();

        $variables = null;
        $only = false;
        if (!$stream->test(/* Token::BLOCK_END_TYPE */ 3)) {
            $variables = $this->parser->getExpressionParser()->parseExpression();
            $only = $stream->nextIf(/* Token::NAME_TYPE */ 5, 'only');
        }

        $stream->expect(/* Token::BLOCK_END_TYPE */ 3);

        $body = $this->parser->subparse([$this, 'decideWithEnd'], true);

        $stream->expect(/* Token::BLOCK_END_TYPE */ 3);

        return new WithNode($body, $variables, $only, $token->getLine(), $this->getTag());
    }

    public function decideWithEnd(Token $token)
    {
        return $token->test('endwith');
    }

    public function getTag()
    {
        return 'with';
    }
}

class_alias('Twig\TokenParser\WithTokenParser', 'Twig_TokenParser_With');
