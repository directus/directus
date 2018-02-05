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
use ReflectionClass;
use Zend\Db\Metadata\Object\ConstraintObject;
use Zend\Db\TableGateway\Feature\FeatureSet;
use Zend\Db\TableGateway\Feature\MasterSlaveFeature;
use Zend\Db\TableGateway\Feature\MetadataFeature;
use Zend\Db\TableGateway\Feature\SequenceFeature;

class FeatureSetTest extends TestCase
{
    /**
     * @cover FeatureSet::addFeature
     * @group ZF2-4993
     */
    public function testAddFeatureThatFeatureDoesNotHaveTableGatewayButFeatureSetHas()
    {
        $mockMasterAdapter = $this->getMockBuilder('Zend\Db\Adapter\AdapterInterface')->getMock();

        $mockStatement = $this->getMockBuilder('Zend\Db\Adapter\Driver\StatementInterface')->getMock();
        $mockDriver = $this->getMockBuilder('Zend\Db\Adapter\Driver\DriverInterface')->getMock();
        $mockDriver->expects($this->any())->method('createStatement')->will($this->returnValue(
            $mockStatement
        ));
        $mockMasterAdapter->expects($this->any())->method('getDriver')->will($this->returnValue($mockDriver));
        $mockMasterAdapter->expects($this->any())->method('getPlatform')->will($this->returnValue(
            new \Zend\Db\Adapter\Platform\Sql92()
        ));

        $mockSlaveAdapter = $this->getMockBuilder('Zend\Db\Adapter\AdapterInterface')->getMock();

        $mockStatement = $this->getMockBuilder('Zend\Db\Adapter\Driver\StatementInterface')->getMock();
        $mockDriver = $this->getMockBuilder('Zend\Db\Adapter\Driver\DriverInterface')->getMock();
        $mockDriver->expects($this->any())->method('createStatement')->will($this->returnValue(
            $mockStatement
        ));
        $mockSlaveAdapter->expects($this->any())->method('getDriver')->will($this->returnValue($mockDriver));
        $mockSlaveAdapter->expects($this->any())->method('getPlatform')->will($this->returnValue(
            new \Zend\Db\Adapter\Platform\Sql92()
        ));

        $tableGatewayMock = $this->getMockForAbstractClass('Zend\Db\TableGateway\AbstractTableGateway');

        //feature doesn't have tableGateway, but FeatureSet has
        $feature = new MasterSlaveFeature($mockSlaveAdapter);

        $featureSet = new FeatureSet;
        $featureSet->setTableGateway($tableGatewayMock);

        self::assertInstanceOf('Zend\Db\TableGateway\Feature\FeatureSet', $featureSet->addFeature($feature));
    }

    /**
     * @cover FeatureSet::addFeature
     * @group ZF2-4993
     */
    public function testAddFeatureThatFeatureHasTableGatewayButFeatureSetDoesNotHave()
    {
        $tableGatewayMock = $this->getMockForAbstractClass('Zend\Db\TableGateway\AbstractTableGateway');

        $metadataMock = $this->getMockBuilder('Zend\Db\Metadata\MetadataInterface')->getMock();
        $metadataMock->expects($this->any())->method('getColumnNames')->will($this->returnValue(['id', 'name']));

        $constraintObject = new ConstraintObject('id_pk', 'table');
        $constraintObject->setColumns(['id']);
        $constraintObject->setType('PRIMARY KEY');

        $metadataMock->expects($this->any())->method('getConstraints')->will($this->returnValue([$constraintObject]));

        //feature have tableGateway, but FeatureSet doesn't has
        $feature = new MetadataFeature($metadataMock);
        $feature->setTableGateway($tableGatewayMock);

        $featureSet = new FeatureSet;
        self::assertInstanceOf('Zend\Db\TableGateway\Feature\FeatureSet', $featureSet->addFeature($feature));
    }

    /**
     * @covers \Zend\Db\TableGateway\Feature\FeatureSet::canCallMagicCall
     */
    public function testCanCallMagicCallReturnsTrueForAddedMethodOfAddedFeature()
    {
        $feature = new SequenceFeature('id', 'table_sequence');
        $featureSet = new FeatureSet;
        $featureSet->addFeature($feature);

        self::assertTrue(
            $featureSet->canCallMagicCall('lastSequenceId'),
            "Should have been able to call lastSequenceId from the Sequence Feature"
        );
    }

    /**
     * @covers \Zend\Db\TableGateway\Feature\FeatureSet::canCallMagicCall
     */
    public function testCanCallMagicCallReturnsFalseForAddedMethodOfAddedFeature()
    {
        $feature = new SequenceFeature('id', 'table_sequence');
        $featureSet = new FeatureSet;
        $featureSet->addFeature($feature);

        self::assertFalse(
            $featureSet->canCallMagicCall('postInitialize'),
            "Should have been able to call postInitialize from the MetaData Feature"
        );
    }

    /**
     * @covers \Zend\Db\TableGateway\Feature\FeatureSet::canCallMagicCall
     */
    public function testCanCallMagicCallReturnsFalseWhenNoFeaturesHaveBeenAdded()
    {
        $featureSet = new FeatureSet;
        self::assertFalse(
            $featureSet->canCallMagicCall('lastSequenceId')
        );
    }

    /**
     * @covers \Zend\Db\TableGateway\Feature\FeatureSet::callMagicCall
     */
    public function testCallMagicCallSucceedsForValidMethodOfAddedFeature()
    {
        $sequenceName = 'table_sequence';

        $platformMock = $this->getMockBuilder('Zend\Db\Adapter\Platform\Postgresql')->getMock();
        $platformMock->expects($this->any())
            ->method('getName')->will($this->returnValue('PostgreSQL'));

        $resultMock = $this->getMockBuilder('Zend\Db\Adapter\Driver\Pgsql\Result')->getMock();
        $resultMock->expects($this->any())
            ->method('current')
            ->will($this->returnValue(['currval' => 1]));

        $statementMock = $this->getMockBuilder('Zend\Db\Adapter\Driver\StatementInterface')->getMock();
        $statementMock->expects($this->any())
            ->method('prepare')
            ->with('SELECT CURRVAL(\'' . $sequenceName . '\')');
        $statementMock->expects($this->any())
            ->method('execute')
            ->will($this->returnValue($resultMock));

        $adapterMock = $this->getMockBuilder('Zend\Db\Adapter\Adapter')
            ->disableOriginalConstructor()
            ->getMock();
        $adapterMock->expects($this->any())
            ->method('getPlatform')->will($this->returnValue($platformMock));
        $adapterMock->expects($this->any())
            ->method('createStatement')->will($this->returnValue($statementMock));

        $tableGatewayMock = $this->getMockBuilder('Zend\Db\TableGateway\AbstractTableGateway')
            ->disableOriginalConstructor()
            ->getMock();

        $reflectionClass = new ReflectionClass('Zend\Db\TableGateway\AbstractTableGateway');
        $reflectionProperty = $reflectionClass->getProperty('adapter');
        $reflectionProperty->setAccessible(true);
        $reflectionProperty->setValue($tableGatewayMock, $adapterMock);

        $feature = new SequenceFeature('id', 'table_sequence');
        $feature->setTableGateway($tableGatewayMock);
        $featureSet = new FeatureSet;
        $featureSet->addFeature($feature);
        self::assertEquals(1, $featureSet->callMagicCall('lastSequenceId', null));
    }
}
