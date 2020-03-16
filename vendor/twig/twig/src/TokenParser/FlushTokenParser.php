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

use Twig\Node\FlushNode;
use Twig\Token;

/**
 * Flushes the output to the client.
 *
 * @see flush()
 */
final class FlushTokenParser extends AbstractTokenParser
{
    public function parse(Token $token)
    {
        $this->parser->getStream()->expect(/* Token::BLOCK_END_TYPE */ 3);

        return new FlushNode($token->getLine(), $this->getTag());
    }

    public function getTag()
    {
        return 'flush';
    }
}

class_alias('Twig\TokenParser\FlushTokenParser', 'Twig_TokenParser_Flush');
