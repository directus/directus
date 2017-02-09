<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Sql\Ddl\Column;

use Zend\Db\Sql\Ddl\Column\Float as FloatColumn;

class FloatTest extends \PHPUnit_Framework_TestCase
{
    public function setUp()
    {
        if (version_compare(PHP_VERSION, '7.0', '>=')) {
            $this->markTestSkipped('Cannot test Float column under PHP 7; reserved keyword');
        }
    }

    public function testRaisesDeprecationNoticeOnInstantiation()
    {
        $this->setExpectedException('PHPUnit_Framework_Error_Deprecated');
        new FloatColumn('foo', 10, 5);
    }
}
