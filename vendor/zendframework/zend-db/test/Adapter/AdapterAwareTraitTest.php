<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Adapter;

use PHPUnit_Framework_TestCase as TestCase;
use Zend\Db\Adapter\Adapter;

class AdapterAwareTraitTest extends TestCase
{
    public function testSetDbAdapter()
    {
        $object = $this->getObjectForTrait('\Zend\Db\Adapter\AdapterAwareTrait');

        $this->assertAttributeEquals(null, 'adapter', $object);

        $driver = $this->getMock('Zend\Db\Adapter\Driver\DriverInterface');
        $platform = $this->getMock('Zend\Db\Adapter\Platform\PlatformInterface');

        $adapter = new Adapter($driver, $platform);

        $object->setDbAdapter($adapter);

        $this->assertAttributeEquals($adapter, 'adapter', $object);
    }
}
