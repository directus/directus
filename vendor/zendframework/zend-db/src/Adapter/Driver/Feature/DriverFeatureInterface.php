<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Adapter\Driver\Feature;

interface DriverFeatureInterface
{
    /**
     * Setup the default features for Pdo
     *
     * @return DriverFeatureInterface
     */
    public function setupDefaultFeatures();

    /**
     * Add feature
     *
     * @param string $name
     * @param mixed $feature
     * @return DriverFeatureInterface
     */
    public function addFeature($name, $feature);

    /**
     * Get feature
     *
     * @param $name
     * @return mixed|false
     */
    public function getFeature($name);
}
