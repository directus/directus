<?php

namespace Cocur\Slugify\Bridge\ZF2;

use Zend\ModuleManager\Feature\ServiceProviderInterface;
use Zend\ModuleManager\Feature\ViewHelperProviderInterface;

/**
 * Class Module
 * @package    cocur/slugify
 * @subpackage bridge
 * @license    http://www.opensource.org/licenses/MIT The MIT License
 */
class Module implements ServiceProviderInterface, ViewHelperProviderInterface
{
    const CONFIG_KEY = 'cocur_slugify';

    /**
     * Expected to return \Zend\ServiceManager\Config object or array to
     * seed such an object.
     *
     * @return array<string,array<string,string>>
     */
    public function getServiceConfig()
    {
        return [
            'factories' => [
                'Cocur\Slugify\Slugify' => 'Cocur\Slugify\Bridge\ZF2\SlugifyService'
            ],
            'aliases' => [
                'slugify' => 'Cocur\Slugify\Slugify'
            ]
        ];
    }

    /**
     * Expected to return \Zend\ServiceManager\Config object or array to
     * seed such an object.
     *
     * @return array<string,array<string,string>>|\Zend\ServiceManager\Config
     */
    public function getViewHelperConfig()
    {
        return [
            'factories' => [
                'slugify' => 'Cocur\Slugify\Bridge\ZF2\SlugifyViewHelperFactory'
            ]
        ];
    }
}
