<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2013 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Adapter;

use Zend\ServiceManager\ServiceManager;
use Zend\Mvc\Service\ServiceManagerConfig;

class AdapterAbstractServiceFactoryTest extends \PHPUnit_Framework_TestCase
{
    /**
     * @var \Zend\ServiceManager\ServiceLocatorInterface
     */
    private $serviceManager;

    /**
     * Set up service manager and database configuration.
     *
     * @see PHPUnit_Framework_TestCase::setUp()
     */
    protected function setUp()
    {
        $this->serviceManager = new ServiceManager(new ServiceManagerConfig(array(
            'abstract_factories' => array('Zend\Db\Adapter\AdapterAbstractServiceFactory'),
        )));

        $this->serviceManager->setService('Config', array(
            'db' => array(
                'adapters' => array(
                    'Zend\Db\Adapter\Writer' => array(
                        'driver' => 'mysqli',
                    ),
                    'Zend\Db\Adapter\Reader' => array(
                        'driver' => 'mysqli',
                    ),
                ),
            ),
        ));
    }

    /**
     * @return array
     */
    public function providerValidService()
    {
        return array(
            array('Zend\Db\Adapter\Writer'),
            array('Zend\Db\Adapter\Reader'),
        );
    }

    /**
     * @return array
     */
    public function providerInvalidService()
    {
        return array(
            array('Zend\Db\Adapter\Unknown'),
        );
    }

    /**
     * @param string $service
     * @dataProvider providerValidService
     */
    public function testValidService($service)
    {
        $actual = $this->serviceManager->get($service);
        $this->assertInstanceOf('Zend\Db\Adapter\Adapter', $actual);
    }

    /**
     * @param string $service
     * @dataProvider providerInvalidService
     * @expectedException \Zend\ServiceManager\Exception\ServiceNotFoundException
     */
    public function testInvalidService($service)
    {
        $actual = $this->serviceManager->get($service);
    }
}
