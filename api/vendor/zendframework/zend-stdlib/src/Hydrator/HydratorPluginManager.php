<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2014 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Stdlib\Hydrator;

use Zend\ServiceManager\AbstractPluginManager;
use Zend\Stdlib\Exception;

/**
 * Plugin manager implementation for hydrators.
 *
 * Enforces that adapters retrieved are instances of HydratorInterface
 */
class HydratorPluginManager extends AbstractPluginManager
{
    /**
     * Whether or not to share by default
     *
     * @var bool
     */
    protected $shareByDefault = false;

    /**
     * Default set of adapters
     *
     * @var array
     */
    protected $invokableClasses = array(
        'arrayserializable' => 'Zend\Stdlib\Hydrator\ArraySerializable',
        'classmethods'      => 'Zend\Stdlib\Hydrator\ClassMethods',
        'objectproperty'    => 'Zend\Stdlib\Hydrator\ObjectProperty',
        'reflection'        => 'Zend\Stdlib\Hydrator\Reflection'
    );

    /**
     * {@inheritDoc}
     */
    public function validatePlugin($plugin)
    {
        if ($plugin instanceof HydratorInterface) {
            // we're okay
            return;
        }

        throw new Exception\RuntimeException(sprintf(
            'Plugin of type %s is invalid; must implement Zend\Stdlib\Hydrator\HydratorInterface',
            (is_object($plugin) ? get_class($plugin) : gettype($plugin))
        ));
    }
}
