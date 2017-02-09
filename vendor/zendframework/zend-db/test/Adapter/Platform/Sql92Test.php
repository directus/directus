<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Adapter\Platform;

use Zend\Db\Adapter\Platform\Sql92;

class Sql92Test extends \PHPUnit_Framework_TestCase
{
    /**
     * @var Sql92
     */
    protected $platform;

    /**
     * Sets up the fixture, for example, opens a network connection.
     * This method is called before a test is executed.
     */
    protected function setUp()
    {
        $this->platform = new Sql92;
    }

    /**
     * @covers Zend\Db\Adapter\Platform\Sql92::getName
     */
    public function testGetName()
    {
        $this->assertEquals('SQL92', $this->platform->getName());
    }

    /**
     * @covers Zend\Db\Adapter\Platform\Sql92::getQuoteIdentifierSymbol
     */
    public function testGetQuoteIdentifierSymbol()
    {
        $this->assertEquals('"', $this->platform->getQuoteIdentifierSymbol());
    }

    /**
     * @covers Zend\Db\Adapter\Platform\Sql92::quoteIdentifier
     */
    public function testQuoteIdentifier()
    {
        $this->assertEquals('"identifier"', $this->platform->quoteIdentifier('identifier'));
    }

    /**
     * @covers Zend\Db\Adapter\Platform\Sql92::quoteIdentifierChain
     */
    public function testQuoteIdentifierChain()
    {
        $this->assertEquals('"identifier"', $this->platform->quoteIdentifierChain('identifier'));
        $this->assertEquals('"identifier"', $this->platform->quoteIdentifierChain(['identifier']));
        $this->assertEquals('"schema"."identifier"', $this->platform->quoteIdentifierChain(['schema', 'identifier']));
    }

    /**
     * @covers Zend\Db\Adapter\Platform\Sql92::getQuoteValueSymbol
     */
    public function testGetQuoteValueSymbol()
    {
        $this->assertEquals("'", $this->platform->getQuoteValueSymbol());
    }

    /**
     * @covers Zend\Db\Adapter\Platform\Sql92::quoteValue
     */
    public function testQuoteValueRaisesNoticeWithoutPlatformSupport()
    {
        $this->setExpectedException(
            'PHPUnit_Framework_Error_Notice',
            'Attempting to quote a value without specific driver level support can introduce security vulnerabilities in a production environment.'
        );
        $this->platform->quoteValue('value');
    }

    /**
     * @covers Zend\Db\Adapter\Platform\Sql92::quoteValue
     */
    public function testQuoteValue()
    {
        $this->assertEquals("'value'", @$this->platform->quoteValue('value'));
        $this->assertEquals("'Foo O\\'Bar'", @$this->platform->quoteValue("Foo O'Bar"));
        $this->assertEquals('\'\\\'; DELETE FROM some_table; -- \'', @$this->platform->quoteValue('\'; DELETE FROM some_table; -- '));
        $this->assertEquals("'\\\\\\'; DELETE FROM some_table; -- '", @$this->platform->quoteValue('\\\'; DELETE FROM some_table; -- '));
    }

    /**
     * @covers Zend\Db\Adapter\Platform\Sql92::quoteTrustedValue
     */
    public function testQuoteTrustedValue()
    {
        $this->assertEquals("'value'", $this->platform->quoteTrustedValue('value'));
        $this->assertEquals("'Foo O\\'Bar'", $this->platform->quoteTrustedValue("Foo O'Bar"));
        $this->assertEquals('\'\\\'; DELETE FROM some_table; -- \'', $this->platform->quoteTrustedValue('\'; DELETE FROM some_table; -- '));

        //                   '\\\'; DELETE FROM some_table; -- '  <- actual below
        $this->assertEquals("'\\\\\\'; DELETE FROM some_table; -- '", $this->platform->quoteTrustedValue('\\\'; DELETE FROM some_table; -- '));
    }

    /**
     * @covers Zend\Db\Adapter\Platform\Sql92::quoteValueList
     */
    public function testQuoteValueList()
    {
        $this->setExpectedException(
            'PHPUnit_Framework_Error',
            'Attempting to quote a value without specific driver level support can introduce security vulnerabilities in a production environment.'
        );
        $this->assertEquals("'Foo O\\'Bar'", $this->platform->quoteValueList("Foo O'Bar"));
    }

    /**
     * @covers Zend\Db\Adapter\Platform\Sql92::getIdentifierSeparator
     */
    public function testGetIdentifierSeparator()
    {
        $this->assertEquals('.', $this->platform->getIdentifierSeparator());
    }

    /**
     * @covers Zend\Db\Adapter\Platform\Sql92::quoteIdentifierInFragment
     */
    public function testQuoteIdentifierInFragment()
    {
        $this->assertEquals('"foo"."bar"', $this->platform->quoteIdentifierInFragment('foo.bar'));
        $this->assertEquals('"foo" as "bar"', $this->platform->quoteIdentifierInFragment('foo as bar'));

        // single char words
        $this->assertEquals('("foo"."bar" = "boo"."baz")', $this->platform->quoteIdentifierInFragment('(foo.bar = boo.baz)', ['(', ')', '=']));

        // case insensitive safe words
        $this->assertEquals(
            '("foo"."bar" = "boo"."baz") AND ("foo"."baz" = "boo"."baz")',
            $this->platform->quoteIdentifierInFragment('(foo.bar = boo.baz) AND (foo.baz = boo.baz)', ['(', ')', '=', 'and'])
        );

        // case insensitive safe words in field
        $this->assertEquals(
            '("foo"."bar" = "boo".baz) AND ("foo".baz = "boo".baz)',
            $this->platform->quoteIdentifierInFragment('(foo.bar = boo.baz) AND (foo.baz = boo.baz)', ['(', ')', '=', 'and', 'bAz'])
        );
    }
}
