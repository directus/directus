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
use Zend\Db\Adapter\Driver\Pdo\Pdo;
use Zend\Db\Adapter\Platform\SqlServer;

class SqlServerTest extends TestCase
{
    /**
     * @var SqlServer
     */
    protected $platform;

    /**
     * Sets up the fixture, for example, opens a network connection.
     * This method is called before a test is executed.
     */
    protected function setUp()
    {
        $this->platform = new SqlServer;
    }

    /**
     * @covers \Zend\Db\Adapter\Platform\SqlServer::getName
     */
    public function testGetName()
    {
        self::assertEquals('SQLServer', $this->platform->getName());
    }

    /**
     * @covers \Zend\Db\Adapter\Platform\SqlServer::getQuoteIdentifierSymbol
     */
    public function testGetQuoteIdentifierSymbol()
    {
        self::assertEquals(['[', ']'], $this->platform->getQuoteIdentifierSymbol());
    }

    /**
     * @covers \Zend\Db\Adapter\Platform\SqlServer::quoteIdentifier
     */
    public function testQuoteIdentifier()
    {
        self::assertEquals('[identifier]', $this->platform->quoteIdentifier('identifier'));
    }

    /**
     * @covers \Zend\Db\Adapter\Platform\SqlServer::quoteIdentifierChain
     */
    public function testQuoteIdentifierChain()
    {
        self::assertEquals('[identifier]', $this->platform->quoteIdentifierChain('identifier'));
        self::assertEquals('[identifier]', $this->platform->quoteIdentifierChain(['identifier']));
        self::assertEquals('[schema].[identifier]', $this->platform->quoteIdentifierChain(['schema', 'identifier']));
    }

    /**
     * @covers \Zend\Db\Adapter\Platform\SqlServer::getQuoteValueSymbol
     */
    public function testGetQuoteValueSymbol()
    {
        self::assertEquals("'", $this->platform->getQuoteValueSymbol());
    }

    /**
     * @covers \Zend\Db\Adapter\Platform\SqlServer::quoteValue
     */
    public function testQuoteValueRaisesNoticeWithoutPlatformSupport()
    {
        $this->expectException(Error\Notice::class);
        $this->expectExceptionMessage(
            'Attempting to quote a value in Zend\Db\Adapter\Platform\SqlServer without extension/driver support can '
            . 'introduce security vulnerabilities in a production environment'
        );
        $this->platform->quoteValue('value');
    }

    /**
     * @covers \Zend\Db\Adapter\Platform\SqlServer::quoteValue
     */
    public function testQuoteValue()
    {
        self::assertEquals("'value'", @$this->platform->quoteValue('value'));
        self::assertEquals("'Foo O''Bar'", @$this->platform->quoteValue("Foo O'Bar"));
        self::assertEquals(
            "'''; DELETE FROM some_table; -- '",
            @$this->platform->quoteValue('\'; DELETE FROM some_table; -- ')
        );
        self::assertEquals(
            "'\\''; DELETE FROM some_table; -- '",
            @$this->platform->quoteValue('\\\'; DELETE FROM some_table; -- ')
        );
    }

    /**
     * @covers \Zend\Db\Adapter\Platform\SqlServer::quoteTrustedValue
     */
    public function testQuoteTrustedValue()
    {
        self::assertEquals("'value'", $this->platform->quoteTrustedValue('value'));
        self::assertEquals("'Foo O''Bar'", $this->platform->quoteTrustedValue("Foo O'Bar"));
        self::assertEquals(
            "'''; DELETE FROM some_table; -- '",
            $this->platform->quoteTrustedValue('\'; DELETE FROM some_table; -- ')
        );
        self::assertEquals(
            "'\\''; DELETE FROM some_table; -- '",
            $this->platform->quoteTrustedValue('\\\'; DELETE FROM some_table; -- ')
        );
    }

    /**
     * @covers \Zend\Db\Adapter\Platform\SqlServer::quoteValueList
     */
    public function testQuoteValueList()
    {
        $this->expectException(Error\Error::class);
        $this->expectExceptionMessage(
            'Attempting to quote a value in Zend\Db\Adapter\Platform\SqlServer without extension/driver support can '
            . 'introduce security vulnerabilities in a production environment'
        );
        self::assertEquals("'Foo O''Bar'", $this->platform->quoteValueList("Foo O'Bar"));
    }

    /**
     * @covers \Zend\Db\Adapter\Platform\SqlServer::getIdentifierSeparator
     */
    public function testGetIdentifierSeparator()
    {
        self::assertEquals('.', $this->platform->getIdentifierSeparator());
    }

    /**
     * @covers \Zend\Db\Adapter\Platform\SqlServer::quoteIdentifierInFragment
     */
    public function testQuoteIdentifierInFragment()
    {
        self::assertEquals('[foo].[bar]', $this->platform->quoteIdentifierInFragment('foo.bar'));
        self::assertEquals('[foo] as [bar]', $this->platform->quoteIdentifierInFragment('foo as bar'));

        // single char words
        self::assertEquals(
            '([foo].[bar] = [boo].[baz])',
            $this->platform->quoteIdentifierInFragment('(foo.bar = boo.baz)', ['(', ')', '='])
        );

        // case insensitive safe words
        self::assertEquals(
            '([foo].[bar] = [boo].[baz]) AND ([foo].[baz] = [boo].[baz])',
            $this->platform->quoteIdentifierInFragment(
                '(foo.bar = boo.baz) AND (foo.baz = boo.baz)',
                ['(', ')', '=', 'and']
            )
        );

        // case insensitive safe words in field
        self::assertEquals(
            '([foo].[bar] = [boo].baz) AND ([foo].baz = [boo].baz)',
            $this->platform->quoteIdentifierInFragment(
                '(foo.bar = boo.baz) AND (foo.baz = boo.baz)',
                ['(', ')', '=', 'and', 'bAz']
            )
        );
    }

    /**
     * @covers \Zend\Db\Adapter\Platform\SqlServer::setDriver
     */
    public function testSetDriver()
    {
        $driver = new Pdo(['pdodriver' => 'sqlsrv']);
        $this->platform->setDriver($driver);
    }

    public function testPlatformQuotesNullByteCharacter()
    {
        set_error_handler(function () {
        });
        $string = "1\0";
        $value = $this->platform->quoteValue($string);
        restore_error_handler();
        self::assertEquals("'1\\000'", $value);
    }
}
