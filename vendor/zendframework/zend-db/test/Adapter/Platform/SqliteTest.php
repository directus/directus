<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2013 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Adapter\Platform;

use Zend\Db\Adapter\Platform\Sqlite;

class SqliteTest extends \PHPUnit_Framework_TestCase
{
    /**
     * @var Sqlite
     */
    protected $platform;

    /**
     * Sets up the fixture, for example, opens a network connection.
     * This method is called before a test is executed.
     */
    protected function setUp()
    {
        $this->platform = new Sqlite;
    }

    /**
     * @covers Zend\Db\Adapter\Platform\Sqlite::getName
     */
    public function testGetName()
    {
        $this->assertEquals('SQLite', $this->platform->getName());
    }

    /**
     * @covers Zend\Db\Adapter\Platform\Sqlite::getQuoteIdentifierSymbol
     */
    public function testGetQuoteIdentifierSymbol()
    {
        $this->assertEquals('"', $this->platform->getQuoteIdentifierSymbol());
    }

    /**
     * @covers Zend\Db\Adapter\Platform\Sqlite::quoteIdentifier
     */
    public function testQuoteIdentifier()
    {
        $this->assertEquals('"identifier"', $this->platform->quoteIdentifier('identifier'));
    }

    /**
     * @covers Zend\Db\Adapter\Platform\Sqlite::quoteIdentifierChain
     */
    public function testQuoteIdentifierChain()
    {
        $this->assertEquals('"identifier"', $this->platform->quoteIdentifierChain('identifier'));
        $this->assertEquals('"identifier"', $this->platform->quoteIdentifierChain(array('identifier')));
        $this->assertEquals('"schema"."identifier"', $this->platform->quoteIdentifierChain(array('schema','identifier')));
    }

    /**
     * @covers Zend\Db\Adapter\Platform\Sqlite::getQuoteValueSymbol
     */
    public function testGetQuoteValueSymbol()
    {
        $this->assertEquals("'", $this->platform->getQuoteValueSymbol());
    }

    /**
     * @covers Zend\Db\Adapter\Platform\Sqlite::quoteValue
     */
    public function testQuoteValue()
    {
        $this->setExpectedException(
            'PHPUnit_Framework_Error',
            'Attempting to quote a value in Zend\Db\Adapter\Platform\Sqlite without extension/driver support can introduce security vulnerabilities in a production environment'
        );
        $this->assertEquals("'value'", $this->platform->quoteValue('value'));
    }

    /**
     * @covers Zend\Db\Adapter\Platform\Sqlite::quoteTrustedValue
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
     * @covers Zend\Db\Adapter\Platform\Sqlite::quoteValueList
     */
    public function testQuoteValueList()
    {
        $this->setExpectedException(
            'PHPUnit_Framework_Error',
            'Attempting to quote a value in Zend\Db\Adapter\Platform\Sqlite without extension/driver support can introduce security vulnerabilities in a production environment'
        );
        $this->assertEquals("'Foo O\\'Bar'", $this->platform->quoteValueList("Foo O'Bar"));
    }

    /**
     * @covers Zend\Db\Adapter\Platform\Sqlite::getIdentifierSeparator
     */
    public function testGetIdentifierSeparator()
    {
        $this->assertEquals('.', $this->platform->getIdentifierSeparator());
    }

    /**
     * @covers Zend\Db\Adapter\Platform\Sqlite::quoteIdentifierInFragment
     */
    public function testQuoteIdentifierInFragment()
    {
        $this->assertEquals('"foo"."bar"', $this->platform->quoteIdentifierInFragment('foo.bar'));
        $this->assertEquals('"foo" as "bar"', $this->platform->quoteIdentifierInFragment('foo as bar'));

        // single char words
        $this->assertEquals('("foo"."bar" = "boo"."baz")', $this->platform->quoteIdentifierInFragment('(foo.bar = boo.baz)', array('(', ')', '=')));

        // case insensitive safe words
        $this->assertEquals(
            '("foo"."bar" = "boo"."baz") AND ("foo"."baz" = "boo"."baz")',
            $this->platform->quoteIdentifierInFragment('(foo.bar = boo.baz) AND (foo.baz = boo.baz)', array('(', ')', '=', 'and'))
        );
    }

    /**
     * @covers Zend\Db\Adapter\Platform\Sqlite::quoteValue
     * @covers Zend\Db\Adapter\Platform\Sqlite::quoteTrustedValue
     */
    public function testCanCloseConnectionAfterQuoteValue()
    {
        // Creating the SQLite database file
        $filePath = realpath(__DIR__) . "/_files/sqlite.db";
        if(!file_exists($filePath)) {
            touch($filePath);
        }

        $driver = new \Zend\Db\Adapter\Driver\Pdo\Pdo(array(
            'driver' => 'Pdo_Sqlite',
            'database' => $filePath
        ));

        $this->platform->setDriver($driver);

        $this->platform->quoteValue("some; random]/ value");
        $this->platform->quoteTrustedValue("some; random]/ value");

        // Closing the connection so we can delete the file
        $driver->getConnection()->disconnect();

        @unlink($filePath);

        $this->assertFalse(file_exists($filePath));
    }
}
