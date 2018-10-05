<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Adapter;

use PHPUnit\Framework\TestCase;
use Zend\ServiceManager\Config;
use Zend\ServiceManager\ServiceManager;

class AdapterAbstractServiceFactoryTest extends TestCase
{
    /**
     * @var \Zend\ServiceManager\ServiceLocatorInterface
     */
    private $serviceManager;

    protected function setUp()
    {
        $this->serviceManager = new ServiceManager();

        $config = new Config([
            'abstract_factories' => ['Zend\Db\Adapter\AdapterAbstractServiceFactory'],
        ]);
        $config->configureServiceManager($this->serviceManager);

        $this->serviceManager->setService('config', [
            'db' => [
                'adapters' => [
                    'Zend\Db\Adapter\Writer' => [
                        'driver' => 'mysqli',
                    ],
                    'Zend\Db\Adapter\Reader' => [
                        'driver' => 'mysqli',
                    ],
                ],
            ],
        ]);
    }

    /**
     * @return array
     */
    public function providerValidService()
    {
        return [
            ['Zend\Db\Adapter\Writer'],
            ['Zend\Db\Adapter\Reader'],
        ];
    }

    /**
     * @return array
     */
    public function providerInvalidService()
    {
        return [
            ['Zend\Db\Adapter\Unknown'],
        ];
    }

    /**
     * @param string $service
     * @dataProvider providerValidService
     * @requires extension mysqli
     */
    public function testValidService($service)
    {
        $actual = $this->serviceManager->get($service);
        self::assertInstanceOf('Zend\Db\Adapter\Adapter', $actual);
    }

    /**
     * @dataProvider providerInvalidService
     *
     * @param string $service
     */
    public function testInvalidService($service)
    {
        $this->expectException('\Zend\ServiceManager\Exception\ServiceNotFoundException');
        $this->serviceManager->get($service);
    }
}
