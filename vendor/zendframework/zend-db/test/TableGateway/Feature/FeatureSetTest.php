<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2014 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\TableGateway\Feature;
use Zend\Db\TableGateway\Feature\FeatureSet;
use Zend\Db\TableGateway\Feature\MasterSlaveFeature;
use Zend\Db\TableGateway\Feature\MetadataFeature;
use Zend\Db\Metadata\Object\ConstraintObject;

class FeatureSetTest extends \PHPUnit_Framework_TestCase
{
    /**
     * @cover FeatureSet::addFeature
     * @group ZF2-4993
     */
    public function testAddFeatureThatFeatureDoesnotHasTableGatewayButFeatureSetHas()
    {
       $mockMasterAdapter = $this->getMock(
            'Zend\Db\Adapter\AdapterInterface',
            array('getDriver', 'getPlatform')
        );

        $mockStatement = $this->getMock('Zend\Db\Adapter\Driver\StatementInterface');
        $mockDriver = $this->getMock('Zend\Db\Adapter\Driver\DriverInterface');
        $mockDriver->expects($this->any())->method('createStatement')->will($this->returnValue(
            $mockStatement
        ));
        $mockMasterAdapter->expects($this->any())->method('getDriver')->will($this->returnValue($mockDriver));
        $mockMasterAdapter->expects($this->any())->method('getPlatform')->will($this->returnValue(new \Zend\Db\Adapter\Platform\Sql92()));

        $mockSlaveAdapter = $this->getMock(
            'Zend\Db\Adapter\AdapterInterface',
            array('getDriver', 'getPlatform')
        );

        $mockStatement = $this->getMock('Zend\Db\Adapter\Driver\StatementInterface');
        $mockDriver = $this->getMock('Zend\Db\Adapter\Driver\DriverInterface');
        $mockDriver->expects($this->any())->method('createStatement')->will($this->returnValue(
            $mockStatement
        ));
        $mockSlaveAdapter->expects($this->any())->method('getDriver')->will($this->returnValue($mockDriver));
        $mockSlaveAdapter->expects($this->any())->method('getPlatform')->will($this->returnValue(new \Zend\Db\Adapter\Platform\Sql92()));

        $tableGatewayMock = $this->getMockForAbstractClass('Zend\Db\TableGateway\AbstractTableGateway');

        //feature doesn't have tableGateway, but FeatureSet has
        $feature = new MasterSlaveFeature($mockSlaveAdapter);

        $featureSet = new FeatureSet;
        $featureSet->setTableGateway($tableGatewayMock);

        $this->assertInstanceOf('Zend\Db\TableGateway\Feature\FeatureSet', $featureSet->addFeature($feature));
    }

    /**
     * @cover FeatureSet::addFeature
     * @group ZF2-4993
     */
    public function testAddFeatureThatFeatureHasTableGatewayButFeatureSetDoesnotHas()
    {
        $tableGatewayMock = $this->getMockForAbstractClass('Zend\Db\TableGateway\AbstractTableGateway');

        $metadataMock = $this->getMock('Zend\Db\Metadata\MetadataInterface');
        $metadataMock->expects($this->any())->method('getColumnNames')->will($this->returnValue(array('id', 'name')));

        $constraintObject = new ConstraintObject('id_pk', 'table');
        $constraintObject->setColumns(array('id'));
        $constraintObject->setType('PRIMARY KEY');

        $metadataMock->expects($this->any())->method('getConstraints')->will($this->returnValue(array($constraintObject)));

        //feature have tableGateway, but FeatureSet doesn't has
        $feature = new MetadataFeature($metadataMock);
        $feature->setTableGateway($tableGatewayMock);

        $featureSet = new FeatureSet;
        $this->assertInstanceOf('Zend\Db\TableGateway\Feature\FeatureSet', $featureSet->addFeature($feature));
    }
}
