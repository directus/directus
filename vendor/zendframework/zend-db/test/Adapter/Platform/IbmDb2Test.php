<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Adapter\Platform;

use Zend\Db\Adapter\Platform\IbmDb2;

class IbmDb2Test extends \PHPUnit_Framework_TestCase
{
    /**
     * @var IbmDb2
     */
    protected $platform;

    /**
     * Sets up the fixture, for example, opens a network connection.
     * This method is called before a test is executed.
     */
    protected function setUp()
    {
        $this->platform = new IbmDb2;
    }

    /**
     * @covers Zend\Db\Adapter\Platform\IbmDb2::getName
     */
    public function testGetName()
    {
        $this->assertEquals('IBM DB2', $this->platform->getName());
    }

    /**
     * @covers Zend\Db\Adapter\Platform\IbmDb2::getQuoteIdentifierSymbol
     */
    public function testGetQuoteIdentifierSymbol()
    {
        $this->assertEquals('"', $this->platform->getQuoteIdentifierSymbol());
    }

    /**
     * @covers Zend\Db\Adapter\Platform\IbmDb2::quoteIdentifier
     */
    public function testQuoteIdentifier()
    {
        $this->assertEquals('"identifier"', $this->platform->quoteIdentifier('identifier'));

        $platform = new IbmDb2(['quote_identifiers' => false]);
        $this->assertEquals('identifier', $platform->quoteIdentifier('identifier'));
    }

    /**
     * @covers Zend\Db\Adapter\Platform\IbmDb2::quoteIdentifierChain
     */
    public function testQuoteIdentifierChain()
    {
        $this->assertEquals('"identifier"', $this->platform->quoteIdentifierChain('identifier'));
        $this->assertEquals('"identifier"', $this->platform->quoteIdentifierChain(['identifier']));
        $this->assertEquals('"schema"."identifier"', $this->platform->quoteIdentifierChain(['schema', 'identifier']));

        $platform = new IbmDb2(['quote_identifiers' => false]);
        $this->assertEquals('identifier', $platform->quoteIdentifierChain('identifier'));
        $this->assertEquals('identifier', $platform->quoteIdentifierChain(['identifier']));
        $this->assertEquals('schema.identifier', $platform->quoteIdentifierChain(['schema', 'identifier']));

        $platform = new IbmDb2(['identifier_separator' => '\\']);
        $this->assertEquals('"schema"\"identifier"', $platform->quoteIdentifierChain(['schema', 'identifier']));
    }

    /**
     * @covers Zend\Db\Adapter\Platform\IbmDb2::getQuoteValueSymbol
     */
    public function testGetQuoteValueSymbol()
    {
        $this->assertEquals("'", $this->platform->getQuoteValueSymbol());
    }

    /**
     * @covers Zend\Db\Adapter\Platform\IbmDb2::quoteValue
     */
    public function testQuoteValueRaisesNoticeWithoutPlatformSupport()
    {
        if (!function_exists('db2_escape_string')) {
            $this->setExpectedException(
                'PHPUnit_Framework_Error_Notice',
                'Attempting to quote a value in Zend\Db\Adapter\Platform\IbmDb2 without extension/driver support can introduce security vulnerabilities in a production environment'
            );
        }
        $this->platform->quoteValue('value');
    }

    /**
     * @covers Zend\Db\Adapter\Platform\IbmDb2::quoteValue
     */
    public function testQuoteValue()
    {
        $this->assertEquals("'value'", @$this->platform->quoteValue('value'));
        $this->assertEquals("'Foo O''Bar'", @$this->platform->quoteValue("Foo O'Bar"));
        $this->assertEquals("'''; DELETE FROM some_table; -- '", @$this->platform->quoteValue("'; DELETE FROM some_table; -- "));
        $this->assertEquals("'\\''; \nDELETE FROM some_table; -- '", @$this->platform->quoteValue("\\'; \nDELETE FROM some_table; -- "));
    }

    /**
     * @covers Zend\Db\Adapter\Platform\IbmDb2::quoteTrustedValue
     */
    public function testQuoteTrustedValue()
    {
        $this->assertEquals("'value'", $this->platform->quoteTrustedValue('value'));
        $this->assertEquals("'Foo O''Bar'", $this->platform->quoteTrustedValue("Foo O'Bar"));
        $this->assertEquals("'''; DELETE FROM some_table; -- '", $this->platform->quoteTrustedValue("'; DELETE FROM some_table; -- "));
        $this->assertEquals("'\\''; \nDELETE FROM some_table; -- '", $this->platform->quoteTrustedValue("\\'; \nDELETE FROM some_table; -- "));
    }

    /**
     * @covers Zend\Db\Adapter\Platform\IbmDb2::quoteValueList
     */
    public function testQuoteValueList()
    {
        if (!function_exists('db2_escape_string')) {
            $this->setExpectedException(
                'PHPUnit_Framework_Error',
                'Attempting to quote a value in Zend\Db\Adapter\Platform\IbmDb2 without extension/driver support can introduce security vulnerabilities in a production environment'
            );
        }
        $this->assertEquals("'Foo O''Bar'", $this->platform->quoteValueList("Foo O'Bar"));
    }

    /**
     * @covers Zend\Db\Adapter\Platform\IbmDb2::getIdentifierSeparator
     */
    public function testGetIdentifierSeparator()
    {
        $this->assertEquals('.', $this->platform->getIdentifierSeparator());

        $platform = new IbmDb2(['identifier_separator' => '\\']);
        $this->assertEquals('\\', $platform->getIdentifierSeparator());
    }

    /**
     * @covers Zend\Db\Adapter\Platform\IbmDb2::quoteIdentifierInFragment
     */
    public function testQuoteIdentifierInFragment()
    {
        $this->assertEquals('"foo"."bar"', $this->platform->quoteIdentifierInFragment('foo.bar'));
        $this->assertEquals('"foo" as "bar"', $this->platform->quoteIdentifierInFragment('foo as bar'));

        $platform = new IbmDb2(['quote_identifiers' => false]);
        $this->assertEquals('foo.bar', $platform->quoteIdentifierInFragment('foo.bar'));
        $this->assertEquals('foo as bar', $platform->quoteIdentifierInFragment('foo as bar'));

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
