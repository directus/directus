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
use Zend\Db\Metadata\Object\ConstraintObject;
use Zend\Db\TableGateway\Feature\MetadataFeature;

class MetadataFeatureTest extends TestCase
{
    /**
     * @group integration-test
     */
    public function testPostInitialize()
    {
        $tableGatewayMock = $this->getMockForAbstractClass('Zend\Db\TableGateway\AbstractTableGateway');

        $metadataMock = $this->getMockBuilder('Zend\Db\Metadata\MetadataInterface')->getMock();
        $metadataMock->expects($this->any())->method('getColumnNames')->will($this->returnValue(['id', 'name']));

        $constraintObject = new ConstraintObject('id_pk', 'table');
        $constraintObject->setColumns(['id']);
        $constraintObject->setType('PRIMARY KEY');

        $metadataMock->expects($this->any())->method('getConstraints')->will($this->returnValue([$constraintObject]));

        $feature = new MetadataFeature($metadataMock);
        $feature->setTableGateway($tableGatewayMock);
        $feature->postInitialize();

        self::assertEquals(['id', 'name'], $tableGatewayMock->getColumns());
    }
}
