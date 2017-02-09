<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Adapter\Platform;

use Zend\Db\Adapter\Platform\Oracle;

class OracleTest extends \PHPUnit_Framework_TestCase
{
    /**
     * @var Oracle
     */
    protected $platform;

    /**
     * Sets up the fixture, for example, opens a network connection.
     * This method is called before a test is executed.
     */
    protected function setUp()
    {
        $this->platform = new Oracle;
    }

    /**
     * @covers Zend\Db\Adapter\Platform\Oracle::__construct
     */
    public function testContructWithOptions()
    {
        $this->assertEquals('"\'test\'.\'test\'"', $this->platform->quoteIdentifier('"test"."test"'));
        $plataform1 = new Oracle(['quote_identifiers'=> false]);
        $this->assertEquals('"test"."test"', $plataform1->quoteIdentifier('"test"."test"'));
        $plataform2 = new Oracle(['quote_identifiers'=> 'false']);
        $this->assertEquals('"test"."test"', $plataform2->quoteIdentifier('"test"."test"'));
    }

    /**
     * @covers Zend\Db\Adapter\Platform\Oracle::__construct
     */
    public function testContructWithDriver()
    {
        $mockDriver = $this->getMockForAbstractClass(
            'Zend\Db\Adapter\Driver\Oci8\Oci8',
            [[]],
            '',
            true,
            true,
            true,
            []
        );
        $platform = new Oracle([], $mockDriver);
        $this->assertEquals($mockDriver, $platform->getDriver());
    }

    /**
     * @covers Zend\Db\Adapter\Platform\Oracle::setDriver
     */
    public function testSetDriver()
    {
        $mockDriver = $this->getMockForAbstractClass(
            'Zend\Db\Adapter\Driver\Oci8\Oci8',
            [[]],
            '',
            true,
            true,
            true,
            []
        );
        $platform = $this->platform->setDriver($mockDriver);
        $this->assertEquals($mockDriver, $platform->getDriver());
    }

    /**
     * @covers Zend\Db\Adapter\Platform\Oracle::setDriver
     * @expectedException Zend\Db\Adapter\Exception\InvalidArgumentException
     * @expectedMessage $driver must be a Oci8 or Oracle PDO Zend\Db\Adapter\Driver, Oci8 instance or Oci PDO instance
     */
    public function testSetDriverInvalid()
    {
        $this->platform->setDriver(null);
    }

    /**
     * @covers Zend\Db\Adapter\Platform\Oracle::getDriver
     */
    public function testGetDriver()
    {
        $this->assertNull($this->platform->getDriver());
    }

    /**
     * @covers Zend\Db\Adapter\Platform\Oracle::getName
     */
    public function testGetName()
    {
        $this->assertEquals('Oracle', $this->platform->getName());
    }

    /**
     * @covers Zend\Db\Adapter\Platform\Oracle::getQuoteIdentifierSymbol
     */
    public function testGetQuoteIdentifierSymbol()
    {
        $this->assertEquals('"', $this->platform->getQuoteIdentifierSymbol());
    }

    /**
     * @covers Zend\Db\Adapter\Platform\Oracle::quoteIdentifier
     */
    public function testQuoteIdentifier()
    {
        $this->assertEquals('"identifier"', $this->platform->quoteIdentifier('identifier'));

        $platform = new Oracle(['quote_identifiers' => false]);
        $this->assertEquals('identifier', $platform->quoteIdentifier('identifier'));
    }

    /**
     * @covers Zend\Db\Adapter\Platform\Oracle::quoteIdentifierChain
     */
    public function testQuoteIdentifierChain()
    {
        $this->assertEquals('"identifier"', $this->platform->quoteIdentifierChain('identifier'));
        $this->assertEquals('"identifier"', $this->platform->quoteIdentifierChain(['identifier']));
        $this->assertEquals('"schema"."identifier"', $this->platform->quoteIdentifierChain(['schema', 'identifier']));

        $platform = new Oracle(['quote_identifiers' => false]);
        $this->assertEquals('identifier', $platform->quoteIdentifierChain('identifier'));
        $this->assertEquals('identifier', $platform->quoteIdentifierChain(['identifier']));
        $this->assertEquals('schema.identifier', $platform->quoteIdentifierChain(['schema', 'identifier']));
    }

    /**
     * @covers Zend\Db\Adapter\Platform\Oracle::getQuoteValueSymbol
     */
    public function testGetQuoteValueSymbol()
    {
        $this->assertEquals("'", $this->platform->getQuoteValueSymbol());
    }

    /**
     * @covers Zend\Db\Adapter\Platform\Oracle::quoteValue
     */
    public function testQuoteValueRaisesNoticeWithoutPlatformSupport()
    {
        $this->setExpectedException(
            'PHPUnit_Framework_Error_Notice',
            'Attempting to quote a value in Zend\Db\Adapter\Platform\Oracle without '
            . 'extension/driver support can introduce security vulnerabilities in a production environment'
        );
        $this->platform->quoteValue('value');
    }

    /**
     * @covers Zend\Db\Adapter\Platform\Oracle::quoteValue
     */
    public function testQuoteValue()
    {
        $this->assertEquals("'value'", @$this->platform->quoteValue('value'));
        $this->assertEquals("'Foo O''Bar'", @$this->platform->quoteValue("Foo O'Bar"));
        $this->assertEquals(
            '\'\'\'; DELETE FROM some_table; -- \'',
            @$this->platform->quoteValue('\'; DELETE FROM some_table; -- ')
        );
        $this->assertEquals(
            "'\\''; DELETE FROM some_table; -- '",
            @$this->platform->quoteValue('\\\'; DELETE FROM some_table; -- ')
        );
    }

    /**
     * @covers Zend\Db\Adapter\Platform\Oracle::quoteTrustedValue
     */
    public function testQuoteTrustedValue()
    {
        $this->assertEquals("'value'", $this->platform->quoteTrustedValue('value'));
        $this->assertEquals("'Foo O''Bar'", $this->platform->quoteTrustedValue("Foo O'Bar"));
        $this->assertEquals(
            '\'\'\'; DELETE FROM some_table; -- \'',
            $this->platform->quoteTrustedValue('\'; DELETE FROM some_table; -- ')
        );

        //                   '\\\'; DELETE FROM some_table; -- '  <- actual below
        $this->assertEquals(
            "'\\''; DELETE FROM some_table; -- '",
            $this->platform->quoteTrustedValue('\\\'; DELETE FROM some_table; -- ')
        );
    }

    /**
     * @covers Zend\Db\Adapter\Platform\Oracle::quoteValueList
     */
    public function testQuoteValueList()
    {
        $this->setExpectedException(
            'PHPUnit_Framework_Error',
            'Attempting to quote a value in Zend\Db\Adapter\Platform\Oracle without '
            . 'extension/driver support can introduce security vulnerabilities in a production environment'
        );
        $this->assertEquals("'Foo O''Bar'", $this->platform->quoteValueList("Foo O'Bar"));
    }

    /**
     * @covers Zend\Db\Adapter\Platform\Oracle::getIdentifierSeparator
     */
    public function testGetIdentifierSeparator()
    {
        $this->assertEquals('.', $this->platform->getIdentifierSeparator());
    }

    /**
     * @covers Zend\Db\Adapter\Platform\Oracle::quoteIdentifierInFragment
     */
    public function testQuoteIdentifierInFragment()
    {
        $this->assertEquals('"foo"."bar"', $this->platform->quoteIdentifierInFragment('foo.bar'));
        $this->assertEquals('"foo" as "bar"', $this->platform->quoteIdentifierInFragment('foo as bar'));

        $platform = new Oracle(['quote_identifiers' => false]);
        $this->assertEquals('foo.bar', $platform->quoteIdentifierInFragment('foo.bar'));
        $this->assertEquals('foo as bar', $platform->quoteIdentifierInFragment('foo as bar'));

        // single char words
        $this->assertEquals(
            '("foo"."bar" = "boo"."baz")',
            $this->platform->quoteIdentifierInFragment('(foo.bar = boo.baz)', ['(', ')', '='])
        );

        // case insensitive safe words
        $this->assertEquals(
            '("foo"."bar" = "boo"."baz") AND ("foo"."baz" = "boo"."baz")',
            $this->platform->quoteIdentifierInFragment(
                '(foo.bar = boo.baz) AND (foo.baz = boo.baz)',
                ['(', ')', '=', 'and']
            )
        );

        // case insensitive safe words in field
        $this->assertEquals(
            '("foo"."bar" = "boo".baz) AND ("foo".baz = "boo".baz)',
            $this->platform->quoteIdentifierInFragment(
                '(foo.bar = boo.baz) AND (foo.baz = boo.baz)',
                ['(', ')', '=', 'and', 'bAz']
            )
        );
    }
}
