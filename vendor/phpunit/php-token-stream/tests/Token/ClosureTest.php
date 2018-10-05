<?php
/*
 * This file is part of php-token-stream.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

use PHPUnit\Framework\TestCase;

class PHP_Token_ClosureTest extends TestCase
{
    /**
     * @var PHP_Token_FUNCTION[]
     */
    private $functions;

    protected function setUp()
    {
        $ts = new PHP_Token_Stream(TEST_FILES_PATH . 'closure.php');

        foreach ($ts as $token) {
            if ($token instanceof PHP_Token_FUNCTION) {
                $this->functions[] = $token;
            }
        }
    }

    /**
     * @covers PHP_Token_FUNCTION::getArguments
     */
    public function testGetArguments()
    {
        $this->assertEquals(['$foo' => null, '$bar' => null], $this->functions[0]->getArguments());
        $this->assertEquals(['$foo' => 'Foo', '$bar' => null], $this->functions[1]->getArguments());
        $this->assertEquals(['$foo' => null, '$bar' => null, '$baz' => null], $this->functions[2]->getArguments());
        $this->assertEquals(['$foo' => 'Foo', '$bar' => null, '$baz' => null], $this->functions[3]->getArguments());
        $this->assertEquals([], $this->functions[4]->getArguments());
        $this->assertEquals([], $this->functions[5]->getArguments());
    }

    /**
     * @covers PHP_Token_FUNCTION::getName
     */
    public function testGetName()
    {
        $this->assertEquals('anonymousFunction:2#5', $this->functions[0]->getName());
        $this->assertEquals('anonymousFunction:3#27', $this->functions[1]->getName());
        $this->assertEquals('anonymousFunction:4#51', $this->functions[2]->getName());
        $this->assertEquals('anonymousFunction:5#71', $this->functions[3]->getName());
        $this->assertEquals('anonymousFunction:6#93', $this->functions[4]->getName());
        $this->assertEquals('anonymousFunction:7#106', $this->functions[5]->getName());
    }

    /**
     * @covers PHP_Token::getLine
     */
    public function testGetLine()
    {
        $this->assertEquals(2, $this->functions[0]->getLine());
        $this->assertEquals(3, $this->functions[1]->getLine());
        $this->assertEquals(4, $this->functions[2]->getLine());
        $this->assertEquals(5, $this->functions[3]->getLine());
    }

    /**
     * @covers PHP_TokenWithScope::getEndLine
     */
    public function testGetEndLine()
    {
        $this->assertEquals(2, $this->functions[0]->getLine());
        $this->assertEquals(3, $this->functions[1]->getLine());
        $this->assertEquals(4, $this->functions[2]->getLine());
        $this->assertEquals(5, $this->functions[3]->getLine());
    }
}
