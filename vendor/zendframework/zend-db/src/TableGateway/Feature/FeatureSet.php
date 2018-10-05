<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\TableGateway\Feature;

use Zend\Db\TableGateway\AbstractTableGateway;
use Zend\Db\TableGateway\TableGatewayInterface;

class FeatureSet
{
    const APPLY_HALT = 'halt';

    protected $tableGateway = null;

    /**
     * @var AbstractFeature[]
     */
    protected $features = [];

    /**
     * @var array
     */
    protected $magicSpecifications = [];

    public function __construct(array $features = [])
    {
        if ($features) {
            $this->addFeatures($features);
        }
    }

    /**
     * @param AbstractTableGateway $tableGateway
     * @return self Provides a fluent interface
     */
    public function setTableGateway(AbstractTableGateway $tableGateway)
    {
        $this->tableGateway = $tableGateway;
        foreach ($this->features as $feature) {
            $feature->setTableGateway($this->tableGateway);
        }
        return $this;
    }

    public function getFeatureByClassName($featureClassName)
    {
        $feature = false;
        foreach ($this->features as $potentialFeature) {
            if ($potentialFeature instanceof $featureClassName) {
                $feature = $potentialFeature;
                break;
            }
        }
        return $feature;
    }

    /**
     * @param array $features
     * @return self Provides a fluent interface
     */
    public function addFeatures(array $features)
    {
        foreach ($features as $feature) {
            $this->addFeature($feature);
        }
        return $this;
    }

    /**
     * @param AbstractFeature $feature
     * @return self Provides a fluent interface
     */
    public function addFeature(AbstractFeature $feature)
    {
        if ($this->tableGateway instanceof TableGatewayInterface) {
            $feature->setTableGateway($this->tableGateway);
        }
        $this->features[] = $feature;
        return $this;
    }

    public function apply($method, $args)
    {
        foreach ($this->features as $feature) {
            if (method_exists($feature, $method)) {
                $return = call_user_func_array([$feature, $method], $args);
                if ($return === self::APPLY_HALT) {
                    break;
                }
            }
        }
    }

    /**
     * @param string $property
     * @return bool
     */
    public function canCallMagicGet($property)
    {
        return false;
    }

    /**
     * @param string $property
     * @return mixed
     */
    public function callMagicGet($property)
    {
        $return = null;
        return $return;
    }

    /**
     * @param string $property
     * @return bool
     */
    public function canCallMagicSet($property)
    {
        return false;
    }

    /**
     * @param $property
     * @param $value
     * @return mixed
     */
    public function callMagicSet($property, $value)
    {
        $return = null;
        return $return;
    }

    /**
     * Is the method requested available in one of the added features
     * @param string $method
     * @return bool
     */
    public function canCallMagicCall($method)
    {
        if (! empty($this->features)) {
            foreach ($this->features as $feature) {
                if (method_exists($feature, $method)) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Call method of on added feature as though it were a local method
     * @param string $method
     * @param array $arguments
     * @return mixed
     */
    public function callMagicCall($method, $arguments)
    {
        foreach ($this->features as $feature) {
            if (method_exists($feature, $method)) {
                return $feature->$method($arguments);
            }
        }

        return;
    }
}
