<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2014 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Stdlib\Hydrator\Aggregate;


use Zend\EventManager\Event;

/**
 * Event triggered when the {@see \Zend\Stdlib\Hydrator\Aggregate\AggregateHydrator} hydrates
 * data into an object
 */
class HydrateEvent extends Event
{
    const EVENT_HYDRATE = 'hydrate';

    /**
     * {@inheritDoc}
     */
    protected $name = self::EVENT_HYDRATE;

    /**
     * @var object
     */
    protected $hydratedObject;

    /**
     * @var array
     */
    protected $hydrationData;

    /**
     * @param object $target
     * @param object $hydratedObject
     * @param array  $hydrationData
     */
    public function __construct($target, $hydratedObject, array $hydrationData)
    {
        $this->target         = $target;
        $this->hydratedObject = $hydratedObject;
        $this->hydrationData  = $hydrationData;
    }

    /**
     * Retrieves the object that is being hydrated
     *
     * @return object
     */
    public function getHydratedObject()
    {
        return $this->hydratedObject;
    }

    /**
     * @param object $hydratedObject
     */
    public function setHydratedObject($hydratedObject)
    {
        $this->hydratedObject = $hydratedObject;
    }

    /**
     * Retrieves the data that is being used for hydration
     *
     * @return array
     */
    public function getHydrationData()
    {
        return $this->hydrationData;
    }

    /**
     * @param array $hydrationData
     */
    public function setHydrationData(array $hydrationData)
    {
        $this->hydrationData = $hydrationData;
    }
}
