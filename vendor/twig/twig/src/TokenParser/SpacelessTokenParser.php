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

use Twig\Node\SpacelessNode;
use Twig\Token;

/**
 * Remove whitespaces between HTML tags.
 *
 *   {% spaceless %}
 *      <div>
 *          <strong>foo</strong>
 *      </div>
 *   {% endspaceless %}
 *   {# output will be <div><strong>foo</strong></div> #}
 *
 * @deprecated since Twig 2.7, to be removed in 3.0 (use the spaceless filter instead)
 */
final class SpacelessTokenParser extends AbstractTokenParser
{
    public function parse(Token $token)
    {
        @trigger_error('The spaceless tag is deprecated since Twig 2.7, use the spaceless filter instead.', E_USER_DEPRECATED);

        $lineno = $token->getLine();

        $this->parser->getStream()->expect(/* Token::BLOCK_END_TYPE */ 3);
        $body = $this->parser->subparse([$this, 'decideSpacelessEnd'], true);
        $this->parser->getStream()->expect(/* Token::BLOCK_END_TYPE */ 3);

        return new SpacelessNode($body, $lineno, $this->getTag());
    }

    public function decideSpacelessEnd(Token $token)
    {
        return $token->test('endspaceless');
    }

    public function getTag()
    {
        return 'spaceless';
    }
}

class_alias('Twig\TokenParser\SpacelessTokenParser', 'Twig_TokenParser_Spaceless');
