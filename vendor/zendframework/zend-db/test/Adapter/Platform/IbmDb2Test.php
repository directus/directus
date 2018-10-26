<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Adapter\Platform;

use PHPUnit\Framework\Error;
use PHPUnit\Framework\TestCase;
use Zend\Db\Adapter\Platform\IbmDb2;

class IbmDb2Test extends TestCase
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
     * @covers \Zend\Db\Adapter\Platform\IbmDb2::getName
     */
    public function testGetName()
    {
        self::assertEquals('IBM DB2', $this->platform->getName());
    }

    /**
     * @covers \Zend\Db\Adapter\Platform\IbmDb2::getQuoteIdentifierSymbol
     */
    public function testGetQuoteIdentifierSymbol()
    {
        self::assertEquals('"', $this->platform->getQuoteIdentifierSymbol());
    }

    /**
     * @covers \Zend\Db\Adapter\Platform\IbmDb2::quoteIdentifier
     */
    public function testQuoteIdentifier()
    {
        self::assertEquals('"identifier"', $this->platform->quoteIdentifier('identifier'));

        $platform = new IbmDb2(['quote_identifiers' => false]);
        self::assertEquals('identifier', $platform->quoteIdentifier('identifier'));
    }

    /**
     * @covers \Zend\Db\Adapter\Platform\IbmDb2::quoteIdentifierChain
     */
    public function testQuoteIdentifierChain()
    {
        self::assertEquals('"identifier"', $this->platform->quoteIdentifierChain('identifier'));
        self::assertEquals('"identifier"', $this->platform->quoteIdentifierChain(['identifier']));
        self::assertEquals('"schema"."identifier"', $this->platform->quoteIdentifierChain(['schema', 'identifier']));

        $platform = new IbmDb2(['quote_identifiers' => false]);
        self::assertEquals('identifier', $platform->quoteIdentifierChain('identifier'));
        self::assertEquals('identifier', $platform->quoteIdentifierChain(['identifier']));
        self::assertEquals('schema.identifier', $platform->quoteIdentifierChain(['schema', 'identifier']));

        $platform = new IbmDb2(['identifier_separator' => '\\']);
        self::assertEquals('"schema"\"identifier"', $platform->quoteIdentifierChain(['schema', 'identifier']));
    }

    /**
     * @covers \Zend\Db\Adapter\Platform\IbmDb2::getQuoteValueSymbol
     */
    public function testGetQuoteValueSymbol()
    {
        self::assertEquals("'", $this->platform->getQuoteValueSymbol());
    }

    /**
     * @covers \Zend\Db\Adapter\Platform\IbmDb2::quoteValue
     */
    public function testQuoteValueRaisesNoticeWithoutPlatformSupport()
    {
        if (! function_exists('db2_escape_string')) {
            $this->expectException(Error\Notice::class);
            $this->expectExceptionMessage(
                'Attempting to quote a value in Zend\Db\Adapter\Platform\IbmDb2 without extension/driver support can '
                . 'introduce security vulnerabilities in a production environment'
            );
        }
        $this->platform->quoteValue('value');
    }

    /**
     * @covers \Zend\Db\Adapter\Platform\IbmDb2::quoteValue
     */
    public function testQuoteValue()
    {
        self::assertEquals("'value'", @$this->platform->quoteValue('value'));
        self::assertEquals("'Foo O''Bar'", @$this->platform->quoteValue("Foo O'Bar"));
        self::assertEquals(
            "'''; DELETE FROM some_table; -- '",
            @$this->platform->quoteValue("'; DELETE FROM some_table; -- ")
        );
        self::assertEquals(
            "'\\''; \nDELETE FROM some_table; -- '",
            @$this->platform->quoteValue("\\'; \nDELETE FROM some_table; -- ")
        );
    }

    /**
     * @covers \Zend\Db\Adapter\Platform\IbmDb2::quoteTrustedValue
     */
    public function testQuoteTrustedValue()
    {
        self::assertEquals("'value'", $this->platform->quoteTrustedValue('value'));
        self::assertEquals("'Foo O''Bar'", $this->platform->quoteTrustedValue("Foo O'Bar"));
        self::assertEquals(
            "'''; DELETE FROM some_table; -- '",
            $this->platform->quoteTrustedValue("'; DELETE FROM some_table; -- ")
        );
        self::assertEquals(
            "'\\''; \nDELETE FROM some_table; -- '",
            $this->platform->quoteTrustedValue("\\'; \nDELETE FROM some_table; -- ")
        );
    }

    /**
     * @covers \Zend\Db\Adapter\Platform\IbmDb2::quoteValueList
     */
    public function testQuoteValueList()
    {
        if (! function_exists('db2_escape_string')) {
            $this->expectException(Error\Error::class);
            $this->expectExceptionMessage(
                'Attempting to quote a value in Zend\Db\Adapter\Platform\IbmDb2 without extension/driver support can '
                . 'introduce security vulnerabilities in a production environment'
            );
        }
        self::assertEquals("'Foo O''Bar'", $this->platform->quoteValueList("Foo O'Bar"));
    }

    /**
     * @covers \Zend\Db\Adapter\Platform\IbmDb2::getIdentifierSeparator
     */
    public function testGetIdentifierSeparator()
    {
        self::assertEquals('.', $this->platform->getIdentifierSeparator());

        $platform = new IbmDb2(['identifier_separator' => '\\']);
        self::assertEquals('\\', $platform->getIdentifierSeparator());
    }

    /**
     * @covers \Zend\Db\Adapter\Platform\IbmDb2::quoteIdentifierInFragment
     */
    public function testQuoteIdentifierInFragment()
    {
        self::assertEquals('"foo"."bar"', $this->platform->quoteIdentifierInFragment('foo.bar'));
        self::assertEquals('"foo" as "bar"', $this->platform->quoteIdentifierInFragment('foo as bar'));

        $platform = new IbmDb2(['quote_identifiers' => false]);
        self::assertEquals('foo.bar', $platform->quoteIdentifierInFragment('foo.bar'));
        self::assertEquals('foo as bar', $platform->quoteIdentifierInFragment('foo as bar'));

        // single char words
        self::assertEquals(
            '("foo"."bar" = "boo"."baz")',
            $this->platform->quoteIdentifierInFragment('(foo.bar = boo.baz)', ['(', ')', '='])
        );

        // case insensitive safe words
        self::assertEquals(
            '("foo"."bar" = "boo"."baz") AND ("foo"."baz" = "boo"."baz")',
            $this->platform->quoteIdentifierInFragment(
                '(foo.bar = boo.baz) AND (foo.baz = boo.baz)',
                ['(', ')', '=', 'and']
            )
        );

        // case insensitive safe words in field
        self::assertEquals(
            '("foo"."bar" = "boo".baz) AND ("foo".baz = "boo".baz)',
            $this->platform->quoteIdentifierInFragment(
                '(foo.bar = boo.baz) AND (foo.baz = boo.baz)',
                ['(', ')', '=', 'and', 'bAz']
            )
        );
    }
}
