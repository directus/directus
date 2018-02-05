<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zend-db for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Adapter;

use Interop\Container\ContainerInterface;
use PHPUnit\Framework\TestCase;
use Zend\Db\Adapter\Adapter;
use Zend\Db\Adapter\AdapterServiceFactory;
use Zend\ServiceManager\ServiceLocatorInterface;

class AdapterServiceFactoryTest extends TestCase
{
    protected function setUp()
    {
        if (! extension_loaded('pdo_sqlite')) {
            $this->markTestSkipped('Adapter factory tests require pdo_sqlite');
        }

        $this->services = $this->prophesize(ServiceLocatorInterface::class);
        $this->services->willImplement(ContainerInterface::class);

        $this->factory = new AdapterServiceFactory();
    }

    public function testV2FactoryReturnsAdapter()
    {
        $this->services->get('config')->willReturn([
            'db' => [
                'driver' => 'Pdo_Sqlite',
                'database' => 'sqlite::memory:',
            ],
        ]);

        $adapter = $this->factory->createService($this->services->reveal());
        self::assertInstanceOf(Adapter::class, $adapter);
    }

    public function testV3FactoryReturnsAdapter()
    {
        $this->services->get('config')->willReturn([
            'db' => [
                'driver' => 'Pdo_Sqlite',
                'database' => 'sqlite::memory:',
            ],
        ]);

        $adapter = $this->factory->__invoke($this->services->reveal(), Adapter::class);
        self::assertInstanceOf(Adapter::class, $adapter);
    }
}
