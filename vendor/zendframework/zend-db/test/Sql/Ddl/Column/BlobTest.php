<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2013 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Sql\Ddl\Column;

use Zend\Db\Sql\Ddl\Column\Blob;

class BlobTest extends \PHPUnit_Framework_TestCase
{
    /**
     * @covers Zend\Db\Sql\Ddl\Column\Blob::setLength
     */
    public function testSetLength()
    {
        $blob = new Blob('foo', 55);
        $this->assertEquals(55, $blob->getLength());
        $this->assertSame($blob, $blob->setLength(20));
        $this->assertEquals(20, $blob->getLength());
    }

    /**
     * @covers Zend\Db\Sql\Ddl\Column\Blob::getLength
     */
    public function testGetLength()
    {
        $blob = new Blob('foo', 55);
        $this->assertEquals(55, $blob->getLength());
    }

    /**
     * @covers Zend\Db\Sql\Ddl\Column\Blob::getExpressionData
     */
    public function testGetExpressionData()
    {
        $column = new Blob('foo', 10000000);
        $this->assertEquals(
            array(array('%s %s', array('foo', 'BLOB 10000000 NOT NULL'), array($column::TYPE_IDENTIFIER, $column::TYPE_LITERAL))),
            $column->getExpressionData()
        );
    }

}
