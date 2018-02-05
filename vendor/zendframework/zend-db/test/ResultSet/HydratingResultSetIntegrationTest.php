<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\ResultSet;

use PHPUnit\Framework\TestCase;
use Zend\Db\ResultSet\HydratingResultSet;

class HydratingResultSetIntegrationTest extends TestCase
{
    /**
     * @covers \Zend\Db\ResultSet\HydratingResultSet::current
     */
    public function testCurrentWillReturnBufferedRow()
    {
        $hydratingRs = new HydratingResultSet;
        $hydratingRs->initialize(new \ArrayIterator([
            ['id' => 1, 'name' => 'one'],
            ['id' => 2, 'name' => 'two'],
        ]));
        $hydratingRs->buffer();
        $obj1 = $hydratingRs->current();
        $hydratingRs->rewind();
        $obj2 = $hydratingRs->current();
        self::assertSame($obj1, $obj2);
    }
}
