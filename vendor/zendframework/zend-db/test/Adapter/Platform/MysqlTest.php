<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Adapter\Platform;

use Zend\Db\Adapter\Platform\Mysql;

class MysqlTest extends \PHPUnit_Framework_TestCase
{
    /**
     * @var Mysql
     */
    protected $platform;

    /**
     * Sets up the fixture, for example, opens a network connection.
     * This method is called before a test is executed.
     */
    protected function setUp()
    {
        $this->platform = new Mysql;
    }

    /**
     * @covers Zend\Db\Adapter\Platform\Mysql::getName
     */
    public function testGetName()
    {
        $this->assertEquals('MySQL', $this->platform->getName());
    }

    /**
     * @covers Zend\Db\Adapter\Platform\Mysql::getQuoteIdentifierSymbol
     */
    public function testGetQuoteIdentifierSymbol()
    {
        $this->assertEquals('`', $this->platform->getQuoteIdentifierSymbol());
    }

    /**
     * @covers Zend\Db\Adapter\Platform\Mysql::quoteIdentifier
     */
    public function testQuoteIdentifier()
    {
        $this->assertEquals('`identifier`', $this->platform->quoteIdentifier('identifier'));
        $this->assertEquals('`ident``ifier`', $this->platform->quoteIdentifier('ident`ifier'));
        $this->assertEquals('`namespace:$identifier`', $this->platform->quoteIdentifier('namespace:$identifier'));
    }

    /**
     * @covers Zend\Db\Adapter\Platform\Mysql::quoteIdentifierChain
     */
    public function testQuoteIdentifierChain()
    {
        $this->assertEquals('`identifier`', $this->platform->quoteIdentifierChain('identifier'));
        $this->assertEquals('`identifier`', $this->platform->quoteIdentifierChain(['identifier']));
        $this->assertEquals('`schema`.`identifier`', $this->platform->quoteIdentifierChain(['schema', 'identifier']));

        $this->assertEquals('`ident``ifier`', $this->platform->quoteIdentifierChain('ident`ifier'));
        $this->assertEquals('`ident``ifier`', $this->platform->quoteIdentifierChain(['ident`ifier']));
        $this->assertEquals('`schema`.`ident``ifier`', $this->platform->quoteIdentifierChain(['schema', 'ident`ifier']));
    }

    /**
     * @covers Zend\Db\Adapter\Platform\Mysql::getQuoteValueSymbol
     */
    public function testGetQuoteValueSymbol()
    {
        $this->assertEquals("'", $this->platform->getQuoteValueSymbol());
    }

    /**
     * @covers Zend\Db\Adapter\Platform\Mysql::quoteValue
     */
    public function testQuoteValueRaisesNoticeWithoutPlatformSupport()
    {
        $this->setExpectedException(
            'PHPUnit_Framework_Error_Notice',
            'Attempting to quote a value in Zend\Db\Adapter\Platform\Mysql without extension/driver support can introduce security vulnerabilities in a production environment'
        );
        $this->platform->quoteValue('value');
    }

    /**
     * @covers Zend\Db\Adapter\Platform\Mysql::quoteValue
     */
    public function testQuoteValue()
    {
        $this->assertEquals("'value'", @$this->platform->quoteValue('value'));
        $this->assertEquals("'Foo O\\'Bar'", @$this->platform->quoteValue("Foo O'Bar"));
        $this->assertEquals('\'\\\'; DELETE FROM some_table; -- \'', @$this->platform->quoteValue('\'; DELETE FROM some_table; -- '));
        $this->assertEquals("'\\\\\\'; DELETE FROM some_table; -- '", @$this->platform->quoteValue('\\\'; DELETE FROM some_table; -- '));
    }

    /**
     * @covers Zend\Db\Adapter\Platform\Mysql::quoteTrustedValue
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
     * @covers Zend\Db\Adapter\Platform\Mysql::quoteValueList
     */
    public function testQuoteValueList()
    {
        $this->setExpectedException(
            'PHPUnit_Framework_Error',
            'Attempting to quote a value in Zend\Db\Adapter\Platform\Mysql without extension/driver support can introduce security vulnerabilities in a production environment'
        );
        $this->assertEquals("'Foo O\\'Bar'", $this->platform->quoteValueList("Foo O'Bar"));
    }

    /**
     * @covers Zend\Db\Adapter\Platform\Mysql::getIdentifierSeparator
     */
    public function testGetIdentifierSeparator()
    {
        $this->assertEquals('.', $this->platform->getIdentifierSeparator());
    }

    /**
     * @covers Zend\Db\Adapter\Platform\Mysql::quoteIdentifierInFragment
     */
    public function testQuoteIdentifierInFragment()
    {
        $this->assertEquals('`foo`.`bar`', $this->platform->quoteIdentifierInFragment('foo.bar'));
        $this->assertEquals('`foo` as `bar`', $this->platform->quoteIdentifierInFragment('foo as bar'));
        $this->assertEquals('`$TableName`.`bar`', $this->platform->quoteIdentifierInFragment('$TableName.bar'));
        $this->assertEquals('`cmis:$TableName` as `cmis:TableAlias`', $this->platform->quoteIdentifierInFragment('cmis:$TableName as cmis:TableAlias'));

        // single char words
        $this->assertEquals('(`foo`.`bar` = `boo`.`baz`)', $this->platform->quoteIdentifierInFragment('(foo.bar = boo.baz)', ['(', ')', '=']));
        $this->assertEquals('(`foo`.`bar`=`boo`.`baz`)', $this->platform->quoteIdentifierInFragment('(foo.bar=boo.baz)', ['(', ')', '=']));
        $this->assertEquals('`foo`=`bar`', $this->platform->quoteIdentifierInFragment('foo=bar', ['=']));

        // case insensitive safe words
        $this->assertEquals(
            '(`foo`.`bar` = `boo`.`baz`) AND (`foo`.`baz` = `boo`.`baz`)',
            $this->platform->quoteIdentifierInFragment('(foo.bar = boo.baz) AND (foo.baz = boo.baz)', ['(', ')', '=', 'and'])
        );

        // case insensitive safe words in field
        $this->assertEquals(
            '(`foo`.`bar` = `boo`.baz) AND (`foo`.baz = `boo`.baz)',
            $this->platform->quoteIdentifierInFragment('(foo.bar = boo.baz) AND (foo.baz = boo.baz)', ['(', ')', '=', 'and', 'bAz'])
        );
    }
}
