<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2014 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\TableGateway\Feature\EventFeature;

use Zend\Db\TableGateway\AbstractTableGateway;
use Zend\EventManager\EventInterface;

class TableGatewayEvent implements EventInterface
{

    /**
     * @var AbstractTableGateway
     */
    protected $target = null;

    /**
     * @var null
     */
    protected $name = null;

    /**
     * @var array|\ArrayAccess
     */
    protected $params = array();

    /**
     * Get event name
     *
     * @return string
     */
    public function getName()
    {
        return $this->name;
    }

    /**
     * Get target/context from which event was triggered
     *
     * @return null|string|object
     */
    public function getTarget()
    {
        return $this->target;
    }

    /**
     * Get parameters passed to the event
     *
     * @return array|\ArrayAccess
     */
    public function getParams()
    {
        return $this->params;
    }

    /**
     * Get a single parameter by name
     *
     * @param  string $name
     * @param  mixed $default Default value to return if parameter does not exist
     * @return mixed
     */
    public function getParam($name, $default = null)
    {
        return (isset($this->params[$name]) ? $this->params[$name] : $default);
    }

    /**
     * Set the event name
     *
     * @param  string $name
     * @return void
     */
    public function setName($name)
    {
        $this->name = $name;
    }

    /**
     * Set the event target/context
     *
     * @param  null|string|object $target
     * @return void
     */
    public function setTarget($target)
    {
        $this->target = $target;
    }

    /**
     * Set event parameters
     *
     * @param  string $params
     * @return void
     */
    public function setParams($params)
    {
        $this->params = $params;
    }

    /**
     * Set a single parameter by key
     *
     * @param  string $name
     * @param  mixed $value
     * @return void
     */
    public function setParam($name, $value)
    {
        $this->params[$name] = $value;
    }

    /**
     * Indicate whether or not the parent EventManagerInterface should stop propagating events
     *
     * @param  bool $flag
     * @return void
     */
    public function stopPropagation($flag = true)
    {
        return;
    }

    /**
     * Has this event indicated event propagation should stop?
     *
     * @return bool
     */
    public function propagationIsStopped()
    {
        return false;
    }
}
