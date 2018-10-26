<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Adapter\Driver\Sqlsrv;

use PHPUnit\Framework\TestCase;

abstract class AbstractIntegrationTest extends TestCase
{
    protected $variables = [
        'hostname' => 'TESTS_ZEND_DB_ADAPTER_DRIVER_SQLSRV_HOSTNAME',
        'username' => 'TESTS_ZEND_DB_ADAPTER_DRIVER_SQLSRV_USERNAME',
        'password' => 'TESTS_ZEND_DB_ADAPTER_DRIVER_SQLSRV_PASSWORD',
    ];
    protected $adapters;

    /**
     * Sets up the fixture, for example, opens a network connection.
     * This method is called before a test is executed.
     */
    protected function setUp()
    {
        if (! getenv('TESTS_ZEND_DB_ADAPTER_DRIVER_SQLSRV')) {
            $this->markTestSkipped('SQLSRV tests are not enabled');
        }
        foreach ($this->variables as $name => $value) {
            if (! getenv($value)) {
                $this->markTestSkipped(
                    'Missing required variable ' . $value . ' from phpunit.xml for this integration test'
                );
            }
            $this->variables[$name] = getenv($value);
        }

        if (! extension_loaded('sqlsrv')) {
            $this->fail('The phpunit group integration-sqlsrv was enabled, but the extension is not loaded.');
        }
    }
}
