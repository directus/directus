<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
class Twig_Tests_LexerTest extends \PHPUnit\Framework\TestCase
{
    /**
     * @group legacy
     */
    public function testLegacyConstructorSignature()
    {
        $lexer = new Twig_Lexer(new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock()));
        $stream = $lexer->tokenize('{{ foo }}', 'foo');
        $this->assertEquals('foo', $stream->getFilename());
        $this->assertEquals('{{ foo }}', $stream->getSource());
    }

    public function testNameLabelForTag()
    {
        $template = '{% § %}';

        $lexer = new Twig_Lexer(new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock()));
        $stream = $lexer->tokenize(new Twig_Source($template, 'index'));

        $stream->expect(Twig_Token::BLOCK_START_TYPE);
        $this->assertSame('§', $stream->expect(Twig_Token::NAME_TYPE)->getValue());
    }

    public function testNameLabelForFunction()
    {
        $template = '{{ §() }}';

        $lexer = new Twig_Lexer(new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock()));
        $stream = $lexer->tokenize(new Twig_Source($template, 'index'));

        $stream->expect(Twig_Token::VAR_START_TYPE);
        $this->assertSame('§', $stream->expect(Twig_Token::NAME_TYPE)->getValue());
    }

    public function testBracketsNesting()
    {
        $template = '{{ {"a":{"b":"c"}} }}';

        $this->assertEquals(2, $this->countToken($template, Twig_Token::PUNCTUATION_TYPE, '{'));
        $this->assertEquals(2, $this->countToken($template, Twig_Token::PUNCTUATION_TYPE, '}'));
    }

    protected function countToken($template, $type, $value = null)
    {
        $lexer = new Twig_Lexer(new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock()));
        $stream = $lexer->tokenize(new Twig_Source($template, 'index'));

        $count = 0;
        while (!$stream->isEOF()) {
            $token = $stream->next();
            if ($type === $token->getType()) {
                if (null === $value || $value === $token->getValue()) {
                    ++$count;
                }
            }
        }

        return $count;
    }

    public function testLineDirective()
    {
        $template = "foo\n"
            ."bar\n"
            ."{% line 10 %}\n"
            ."{{\n"
            ."baz\n"
            ."}}\n";

        $lexer = new Twig_Lexer(new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock()));
        $stream = $lexer->tokenize(new Twig_Source($template, 'index'));

        // foo\nbar\n
        $this->assertSame(1, $stream->expect(Twig_Token::TEXT_TYPE)->getLine());
        // \n (after {% line %})
        $this->assertSame(10, $stream->expect(Twig_Token::TEXT_TYPE)->getLine());
        // {{
        $this->assertSame(11, $stream->expect(Twig_Token::VAR_START_TYPE)->getLine());
        // baz
        $this->assertSame(12, $stream->expect(Twig_Token::NAME_TYPE)->getLine());
    }

    public function testLineDirectiveInline()
    {
        $template = "foo\n"
            ."bar{% line 10 %}{{\n"
            ."baz\n"
            ."}}\n";

        $lexer = new Twig_Lexer(new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock()));
        $stream = $lexer->tokenize(new Twig_Source($template, 'index'));

        // foo\nbar
        $this->assertSame(1, $stream->expect(Twig_Token::TEXT_TYPE)->getLine());
        // {{
        $this->assertSame(10, $stream->expect(Twig_Token::VAR_START_TYPE)->getLine());
        // baz
        $this->assertSame(11, $stream->expect(Twig_Token::NAME_TYPE)->getLine());
    }

    public function testLongComments()
    {
        $template = '{# '.str_repeat('*', 100000).' #}';

        $lexer = new Twig_Lexer(new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock()));
        $lexer->tokenize(new Twig_Source($template, 'index'));

        // add a dummy assertion here to satisfy PHPUnit, the only thing we want to test is that the code above
        // can be executed without throwing any exceptions
        $this->addToAssertionCount(1);
    }

    public function testLongVerbatim()
    {
        $template = '{% verbatim %}'.str_repeat('*', 100000).'{% endverbatim %}';

        $lexer = new Twig_Lexer(new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock()));
        $lexer->tokenize(new Twig_Source($template, 'index'));

        // add a dummy assertion here to satisfy PHPUnit, the only thing we want to test is that the code above
        // can be executed without throwing any exceptions
        $this->addToAssertionCount(1);
    }

    public function testLongVar()
    {
        $template = '{{ '.str_repeat('x', 100000).' }}';

        $lexer = new Twig_Lexer(new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock()));
        $lexer->tokenize(new Twig_Source($template, 'index'));

        // add a dummy assertion here to satisfy PHPUnit, the only thing we want to test is that the code above
        // can be executed without throwing any exceptions
        $this->addToAssertionCount(1);
    }

    public function testLongBlock()
    {
        $template = '{% '.str_repeat('x', 100000).' %}';

        $lexer = new Twig_Lexer(new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock()));
        $lexer->tokenize(new Twig_Source($template, 'index'));

        // add a dummy assertion here to satisfy PHPUnit, the only thing we want to test is that the code above
        // can be executed without throwing any exceptions
        $this->addToAssertionCount(1);
    }

    public function testBigNumbers()
    {
        $template = '{{ 922337203685477580700 }}';

        $lexer = new Twig_Lexer(new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock()));
        $stream = $lexer->tokenize(new Twig_Source($template, 'index'));
        $stream->next();
        $node = $stream->next();
        $this->assertEquals('922337203685477580700', $node->getValue());
    }

    public function testStringWithEscapedDelimiter()
    {
        $tests = array(
            "{{ 'foo \' bar' }}" => 'foo \' bar',
            '{{ "foo \" bar" }}' => 'foo " bar',
        );
        $lexer = new Twig_Lexer(new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock()));
        foreach ($tests as $template => $expected) {
            $stream = $lexer->tokenize(new Twig_Source($template, 'index'));
            $stream->expect(Twig_Token::VAR_START_TYPE);
            $stream->expect(Twig_Token::STRING_TYPE, $expected);

            // add a dummy assertion here to satisfy PHPUnit, the only thing we want to test is that the code above
            // can be executed without throwing any exceptions
            $this->addToAssertionCount(1);
        }
    }

    public function testStringWithInterpolation()
    {
        $template = 'foo {{ "bar #{ baz + 1 }" }}';

        $lexer = new Twig_Lexer(new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock()));
        $stream = $lexer->tokenize(new Twig_Source($template, 'index'));
        $stream->expect(Twig_Token::TEXT_TYPE, 'foo ');
        $stream->expect(Twig_Token::VAR_START_TYPE);
        $stream->expect(Twig_Token::STRING_TYPE, 'bar ');
        $stream->expect(Twig_Token::INTERPOLATION_START_TYPE);
        $stream->expect(Twig_Token::NAME_TYPE, 'baz');
        $stream->expect(Twig_Token::OPERATOR_TYPE, '+');
        $stream->expect(Twig_Token::NUMBER_TYPE, '1');
        $stream->expect(Twig_Token::INTERPOLATION_END_TYPE);
        $stream->expect(Twig_Token::VAR_END_TYPE);

        // add a dummy assertion here to satisfy PHPUnit, the only thing we want to test is that the code above
        // can be executed without throwing any exceptions
        $this->addToAssertionCount(1);
    }

    public function testStringWithEscapedInterpolation()
    {
        $template = '{{ "bar \#{baz+1}" }}';

        $lexer = new Twig_Lexer(new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock()));
        $stream = $lexer->tokenize(new Twig_Source($template, 'index'));
        $stream->expect(Twig_Token::VAR_START_TYPE);
        $stream->expect(Twig_Token::STRING_TYPE, 'bar #{baz+1}');
        $stream->expect(Twig_Token::VAR_END_TYPE);

        // add a dummy assertion here to satisfy PHPUnit, the only thing we want to test is that the code above
        // can be executed without throwing any exceptions
        $this->addToAssertionCount(1);
    }

    public function testStringWithHash()
    {
        $template = '{{ "bar # baz" }}';

        $lexer = new Twig_Lexer(new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock()));
        $stream = $lexer->tokenize(new Twig_Source($template, 'index'));
        $stream->expect(Twig_Token::VAR_START_TYPE);
        $stream->expect(Twig_Token::STRING_TYPE, 'bar # baz');
        $stream->expect(Twig_Token::VAR_END_TYPE);

        // add a dummy assertion here to satisfy PHPUnit, the only thing we want to test is that the code above
        // can be executed without throwing any exceptions
        $this->addToAssertionCount(1);
    }

    /**
     * @expectedException Twig_Error_Syntax
     * @expectedExceptionMessage Unclosed """
     */
    public function testStringWithUnterminatedInterpolation()
    {
        $template = '{{ "bar #{x" }}';

        $lexer = new Twig_Lexer(new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock()));
        $lexer->tokenize(new Twig_Source($template, 'index'));
    }

    public function testStringWithNestedInterpolations()
    {
        $template = '{{ "bar #{ "foo#{bar}" }" }}';

        $lexer = new Twig_Lexer(new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock()));
        $stream = $lexer->tokenize(new Twig_Source($template, 'index'));
        $stream->expect(Twig_Token::VAR_START_TYPE);
        $stream->expect(Twig_Token::STRING_TYPE, 'bar ');
        $stream->expect(Twig_Token::INTERPOLATION_START_TYPE);
        $stream->expect(Twig_Token::STRING_TYPE, 'foo');
        $stream->expect(Twig_Token::INTERPOLATION_START_TYPE);
        $stream->expect(Twig_Token::NAME_TYPE, 'bar');
        $stream->expect(Twig_Token::INTERPOLATION_END_TYPE);
        $stream->expect(Twig_Token::INTERPOLATION_END_TYPE);
        $stream->expect(Twig_Token::VAR_END_TYPE);

        // add a dummy assertion here to satisfy PHPUnit, the only thing we want to test is that the code above
        // can be executed without throwing any exceptions
        $this->addToAssertionCount(1);
    }

    public function testStringWithNestedInterpolationsInBlock()
    {
        $template = '{% foo "bar #{ "foo#{bar}" }" %}';

        $lexer = new Twig_Lexer(new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock()));
        $stream = $lexer->tokenize(new Twig_Source($template, 'index'));
        $stream->expect(Twig_Token::BLOCK_START_TYPE);
        $stream->expect(Twig_Token::NAME_TYPE, 'foo');
        $stream->expect(Twig_Token::STRING_TYPE, 'bar ');
        $stream->expect(Twig_Token::INTERPOLATION_START_TYPE);
        $stream->expect(Twig_Token::STRING_TYPE, 'foo');
        $stream->expect(Twig_Token::INTERPOLATION_START_TYPE);
        $stream->expect(Twig_Token::NAME_TYPE, 'bar');
        $stream->expect(Twig_Token::INTERPOLATION_END_TYPE);
        $stream->expect(Twig_Token::INTERPOLATION_END_TYPE);
        $stream->expect(Twig_Token::BLOCK_END_TYPE);

        // add a dummy assertion here to satisfy PHPUnit, the only thing we want to test is that the code above
        // can be executed without throwing any exceptions
        $this->addToAssertionCount(1);
    }

    public function testOperatorEndingWithALetterAtTheEndOfALine()
    {
        $template = "{{ 1 and\n0}}";

        $lexer = new Twig_Lexer(new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock()));
        $stream = $lexer->tokenize(new Twig_Source($template, 'index'));
        $stream->expect(Twig_Token::VAR_START_TYPE);
        $stream->expect(Twig_Token::NUMBER_TYPE, 1);
        $stream->expect(Twig_Token::OPERATOR_TYPE, 'and');

        // add a dummy assertion here to satisfy PHPUnit, the only thing we want to test is that the code above
        // can be executed without throwing any exceptions
        $this->addToAssertionCount(1);
    }

    /**
     * @expectedException Twig_Error_Syntax
     * @expectedExceptionMessage Unclosed "variable" in "index" at line 3
     */
    public function testUnterminatedVariable()
    {
        $template = '

{{

bar


';

        $lexer = new Twig_Lexer(new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock()));
        $lexer->tokenize(new Twig_Source($template, 'index'));
    }

    /**
     * @expectedException Twig_Error_Syntax
     * @expectedExceptionMessage Unclosed "block" in "index" at line 3
     */
    public function testUnterminatedBlock()
    {
        $template = '

{%

bar


';

        $lexer = new Twig_Lexer(new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock()));
        $lexer->tokenize(new Twig_Source($template, 'index'));
    }
}
