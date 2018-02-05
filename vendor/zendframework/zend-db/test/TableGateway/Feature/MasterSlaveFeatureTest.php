<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\TableGateway\Feature;

use PHPUnit\Framework\TestCase;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\TableGateway\Feature\MasterSlaveFeature;

class MasterSlaveFeatureTest extends TestCase
{
    /** @var AdapterInterface */
    protected $mockMasterAdapter;

    /** @var AdapterInterface */
    protected $mockSlaveAdapter;

    /** @var MasterSlaveFeature */
    protected $feature;

    /** @var \Zend\Db\TableGateway\TableGateway */
    protected $table;

    protected function setUp()
    {
        $this->mockMasterAdapter = $this->getMockBuilder('Zend\Db\Adapter\AdapterInterface')->getMock();

        $mockStatement = $this->getMockBuilder('Zend\Db\Adapter\Driver\StatementInterface')->getMock();
        $mockDriver = $this->getMockBuilder('Zend\Db\Adapter\Driver\DriverInterface')->getMock();
        $mockDriver->expects($this->any())->method('createStatement')->will($this->returnValue(
            $mockStatement
        ));
        $this->mockMasterAdapter->expects($this->any())->method('getDriver')->will($this->returnValue($mockDriver));
        $this->mockMasterAdapter->expects($this->any())->method('getPlatform')->will($this->returnValue(
            new \Zend\Db\Adapter\Platform\Sql92()
        ));

        $this->mockSlaveAdapter = $this->getMockBuilder('Zend\Db\Adapter\AdapterInterface')->getMock();

        $mockStatement = $this->getMockBuilder('Zend\Db\Adapter\Driver\StatementInterface')->getMock();
        $mockDriver = $this->getMockBuilder('Zend\Db\Adapter\Driver\DriverInterface')->getMock();
        $mockDriver->expects($this->any())->method('createStatement')->will($this->returnValue(
            $mockStatement
        ));
        $this->mockSlaveAdapter->expects($this->any())->method('getDriver')->will($this->returnValue($mockDriver));
        $this->mockSlaveAdapter->expects($this->any())->method('getPlatform')->will($this->returnValue(
            new \Zend\Db\Adapter\Platform\Sql92()
        ));

        $this->feature = new MasterSlaveFeature($this->mockSlaveAdapter);
    }

    public function testPostInitialize()
    {
        /** @var $table \Zend\Db\TableGateway\TableGateway */
        $this->getMockForAbstractClass(
            'Zend\Db\TableGateway\TableGateway',
            ['foo', $this->mockMasterAdapter, $this->feature]
        );
        // postInitialize is run
        self::assertSame($this->mockSlaveAdapter, $this->feature->getSlaveSql()->getAdapter());
    }

    public function testPreSelect()
    {
        $table = $this->getMockForAbstractClass(
            'Zend\Db\TableGateway\TableGateway',
            ['foo', $this->mockMasterAdapter, $this->feature]
        );

        $this->mockSlaveAdapter->getDriver()->createStatement()
            ->expects($this->once())->method('execute')->will($this->returnValue(
                $this->getMockBuilder('Zend\Db\ResultSet\ResultSet')->getMock()
            ));
        $table->select('foo = bar');
    }

    public function testPostSelect()
    {
        $table = $this->getMockForAbstractClass(
            'Zend\Db\TableGateway\TableGateway',
            ['foo', $this->mockMasterAdapter, $this->feature]
        );
        $this->mockSlaveAdapter->getDriver()->createStatement()
            ->expects($this->once())->method('execute')->will($this->returnValue(
                $this->getMockBuilder('Zend\Db\ResultSet\ResultSet')->getMock()
            ));

        $masterSql = $table->getSql();
        $table->select('foo = bar');

        // test that the sql object is restored
        self::assertSame($masterSql, $table->getSql());
    }
}
