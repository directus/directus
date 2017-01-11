<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Adapter\Driver;

interface DriverInterface
{
    const PARAMETERIZATION_POSITIONAL = 'positional';
    const PARAMETERIZATION_NAMED = 'named';
    const NAME_FORMAT_CAMELCASE = 'camelCase';
    const NAME_FORMAT_NATURAL = 'natural';

    /**
     * Get database platform name
     *
     * @param string $nameFormat
     * @return string
     */
    public function getDatabasePlatformName($nameFormat = self::NAME_FORMAT_CAMELCASE);

    /**
     * Check environment
     *
     * @return bool
     */
    public function checkEnvironment();

    /**
     * Get connection
     *
     * @return ConnectionInterface
     */
    public function getConnection();

    /**
     * Create statement
     *
     * @param string|resource $sqlOrResource
     * @return StatementInterface
     */
    public function createStatement($sqlOrResource = null);

    /**
     * Create result
     *
     * @param resource $resource
     * @return ResultInterface
     */
    public function createResult($resource);

    /**
     * Get prepare type
     *
     * @return string
     */
    public function getPrepareType();

    /**
     * Format parameter name
     *
     * @param string $name
     * @param mixed  $type
     * @return string
     */
    public function formatParameterName($name, $type = null);

    /**
     * Get last generated value
     *
     * @return mixed
     */
    public function getLastGeneratedValue();
}
