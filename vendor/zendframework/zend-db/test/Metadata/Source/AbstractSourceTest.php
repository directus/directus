<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2014 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Metadata\Source;

use Zend\Db\Metadata\Source\AbstractSource;

class AbstractSourceTest extends \PHPUnit_Framework_TestCase
{
    /**
     * @var AbstractSource
     */
    protected $abstractSourceMock = null;

    public function setup()
    {
        $this->abstractSourceMock = $this->getMockForAbstractClass('Zend\Db\Metadata\Source\AbstractSource', array(), '', false);
    }

    public function testGetConstraintKeys()
    {
        $refProp = new \ReflectionProperty($this->abstractSourceMock, 'data');
        $refProp->setAccessible(true);

        // internal data
        $data = array(
            'constraint_references' => array(
                'foo_schema' => array(
                    array(
                        'constraint_name' => 'bam_constraint',
                        'update_rule' => 'UP',
                        'delete_rule' => 'DOWN',
                        'referenced_table_name' => 'another_table',
                        'referenced_column_name' => 'another_column'
                    )
                )
            ),
            'constraint_keys' => array(
                'foo_schema' => array(
                    array(
                        'table_name'=> 'bar_table',
                        'constraint_name' => 'bam_constraint',
                        'column_name' => 'a',
                        'ordinal_position' => 1,
                    )
                )
            )
        );

        $refProp->setValue($this->abstractSourceMock, $data);
        $constraints = $this->abstractSourceMock->getConstraintKeys('bam_constraint', 'bar_table', 'foo_schema');
        $this->assertCount(1, $constraints);

        /**
         * @var \Zend\Db\Metadata\Object\ConstraintKeyObject $constraintKeyObj
         */
        $constraintKeyObj = $constraints[0];
        $this->assertInstanceOf('Zend\Db\Metadata\Object\ConstraintKeyObject', $constraintKeyObj);

        // check value object is mapped correctly
        $this->assertEquals('a', $constraintKeyObj->getColumnName());
        $this->assertEquals(1, $constraintKeyObj->getOrdinalPosition());
        $this->assertEquals('another_table', $constraintKeyObj->getReferencedTableName());
        $this->assertEquals('another_column', $constraintKeyObj->getReferencedColumnName());
        $this->assertEquals('UP', $constraintKeyObj->getForeignKeyUpdateRule());
        $this->assertEquals('DOWN', $constraintKeyObj->getForeignKeyDeleteRule());
    }
}
