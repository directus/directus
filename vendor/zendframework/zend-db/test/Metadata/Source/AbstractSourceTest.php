<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Metadata\Source;

use PHPUnit\Framework\TestCase;
use Zend\Db\Metadata\Source\AbstractSource;

class AbstractSourceTest extends TestCase
{
    /**
     * @var AbstractSource
     */
    protected $abstractSourceMock;

    protected function setUp()
    {
        $this->abstractSourceMock = $this->getMockForAbstractClass(
            'Zend\Db\Metadata\Source\AbstractSource',
            [],
            '',
            false
        );
    }

    public function testGetConstraintKeys()
    {
        $refProp = new \ReflectionProperty($this->abstractSourceMock, 'data');
        $refProp->setAccessible(true);

        // internal data
        $data = [
            'constraint_references' => [
                'foo_schema' => [
                    [
                        'constraint_name' => 'bam_constraint',
                        'update_rule' => 'UP',
                        'delete_rule' => 'DOWN',
                        'referenced_table_name' => 'another_table',
                        'referenced_column_name' => 'another_column',
                    ],
                ],
            ],
            'constraint_keys' => [
                'foo_schema' => [
                    [
                        'table_name' => 'bar_table',
                        'constraint_name' => 'bam_constraint',
                        'column_name' => 'a',
                        'ordinal_position' => 1,
                    ],
                ],
            ],
        ];

        $refProp->setValue($this->abstractSourceMock, $data);
        $constraints = $this->abstractSourceMock->getConstraintKeys('bam_constraint', 'bar_table', 'foo_schema');
        self::assertCount(1, $constraints);

        /**
         * @var \Zend\Db\Metadata\Object\ConstraintKeyObject $constraintKeyObj
         */
        $constraintKeyObj = $constraints[0];
        self::assertInstanceOf('Zend\Db\Metadata\Object\ConstraintKeyObject', $constraintKeyObj);

        // check value object is mapped correctly
        self::assertEquals('a', $constraintKeyObj->getColumnName());
        self::assertEquals(1, $constraintKeyObj->getOrdinalPosition());
        self::assertEquals('another_table', $constraintKeyObj->getReferencedTableName());
        self::assertEquals('another_column', $constraintKeyObj->getReferencedColumnName());
        self::assertEquals('UP', $constraintKeyObj->getForeignKeyUpdateRule());
        self::assertEquals('DOWN', $constraintKeyObj->getForeignKeyDeleteRule());
    }
}
