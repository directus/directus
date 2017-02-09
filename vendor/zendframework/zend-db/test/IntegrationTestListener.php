<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db;

use Exception;
use PHPUnit_Framework_AssertionFailedError;
use PHPUnit_Framework_Test;
use PHPUnit_Framework_TestListener;
use PHPUnit_Framework_TestSuite;

class IntegrationTestListener implements PHPUnit_Framework_TestListener
{
    protected $adapters = [
        'mysqli' => null,
        'pdo_mysql' => null,
        'pgsql' => null,
        'pdo_pgsql' => null,
        'pdo_sqlite' => null,
        'sqlsrv' => null,
        'pdo_sqlsrv' => null,
    ];

    public function __construct()
    {
        if (getenv('TESTS_ZEND_DB_ADAPTER_DRIVER_MYSQL_HOSTNAME')) {
            if (extension_loaded('mysqli')) {
                $this->adapters['mysqli'] = new \mysqli(
                    getenv('TESTS_ZEND_DB_ADAPTER_DRIVER_MYSQL_HOSTNAME'),
                    getenv('TESTS_ZEND_DB_ADAPTER_DRIVER_MYSQL_USERNAME'),
                    getenv('TESTS_ZEND_DB_ADAPTER_DRIVER_MYSQL_PASSWORD'),
                    getenv('TESTS_ZEND_DB_ADAPTER_DRIVER_MYSQL_DATABASE')
                );
            }
            if (extension_loaded('pdo')) {
                $this->adapters['pdo_mysql'] = new \Pdo(
                    'mysql:host=' . getenv('TESTS_ZEND_DB_ADAPTER_DRIVER_MYSQL_HOSTNAME') . ';dbname=' . getenv('TESTS_ZEND_DB_ADAPTER_DRIVER_MYSQL_DATABASE'),
                    getenv('TESTS_ZEND_DB_ADAPTER_DRIVER_MYSQL_USERNAME'),
                    getenv('TESTS_ZEND_DB_ADAPTER_DRIVER_MYSQL_PASSWORD')
                );
            }
        }
        if (getenv('TESTS_ZEND_DB_ADAPTER_DRIVER_PGSQL_HOSTNAME')) {
            if (extension_loaded('pgsql')) {
                $this->adapters['pgsql'] = pg_connect(
                    'host=' . getenv('TESTS_ZEND_DB_ADAPTER_DRIVER_PGSQL_HOSTNAME')
                        . ' dbname=' . getenv('TESTS_ZEND_DB_ADAPTER_DRIVER_PGSQL_DATABASE')
                        . ' user=' . getenv('TESTS_ZEND_DB_ADAPTER_DRIVER_PGSQL_USERNAME')
                        . ' password=' . getenv('TESTS_ZEND_DB_ADAPTER_DRIVER_PGSQL_PASSWORD')
                );
            }
            if (extension_loaded('pdo')) {
                $this->adapters['pdo_pgsql'] = new \Pdo(
                    'pgsql:host=' . getenv('TESTS_ZEND_DB_ADAPTER_DRIVER_PGSQL_HOSTNAME') . ';dbname=' . getenv('TESTS_ZEND_DB_ADAPTER_DRIVER_PGSQL_DATABASE'),
                    getenv('TESTS_ZEND_DB_ADAPTER_DRIVER_PGSQL_USERNAME'),
                    getenv('TESTS_ZEND_DB_ADAPTER_DRIVER_PGSQL_PASSWORD')
                );
            }
        }
        if (getenv('TESTS_ZEND_DB_ADAPTER_DRIVER_SQLITE_MEMORY')) {
            if (extension_loaded('pdo')) {
                $this->adapters['pdo_sqlite'] = new \Pdo(
                    'sqlite::memory:'
                );
            }
        }
        if (getenv('TESTS_ZEND_DB_ADAPTER_DRIVER_SQLSRV_HOSTNAME')) {
            if (extension_loaded('sqlsrv')) {
                $this->adapters['sqlsrv'] = sqlsrv_connect(
                    getenv('TESTS_ZEND_DB_ADAPTER_DRIVER_SQLSRV_HOSTNAME'),
                    [
                        'UID' => getenv('TESTS_ZEND_DB_ADAPTER_DRIVER_SQLSRV_USERNAME'),
                        'PWD' => getenv('TESTS_ZEND_DB_ADAPTER_DRIVER_SQLSRV_PASSWORD'),
                        'Database' => (getenv('TESTS_ZEND_DB_ADAPTER_DRIVER_SQLSRV_DATABASE')
                            ? : null)
                    ]
                );
                if (!$this->adapters['sqlsrv']) {
                    var_dump(sqlsrv_errors());
                    exit;
                }
            }
            if (extension_loaded('pdo')) {
                $this->adapters['pdo_sqlsrv'] = new \Pdo(
                    'sqlsrv:Server=' . getenv('TESTS_ZEND_DB_ADAPTER_DRIVER_SQLSRV_HOSTNAME')
                        . ';Database=' . (getenv('TESTS_ZEND_DB_ADAPTER_DRIVER_SQLSRV_DATABASE')
                            ?  : null),
                    getenv('TESTS_ZEND_DB_ADAPTER_DRIVER_SQLSRV_USERNAME'),
                    getenv('TESTS_ZEND_DB_ADAPTER_DRIVER_SQLSRV_PASSWORD')
                );
            }
        }
    }

    /** methods required for the listener interface compliance */
    public function addError(PHPUnit_Framework_Test $test, Exception $e, $time)
    {
    }
    public function addFailure(PHPUnit_Framework_Test $test, PHPUnit_Framework_AssertionFailedError $e, $time)
    {
    }
    public function addIncompleteTest(PHPUnit_Framework_Test $test, Exception $e, $time)
    {
    }
    public function addSkippedTest(PHPUnit_Framework_Test $test, Exception $e, $time)
    {
    }
    public function startTestSuite(PHPUnit_Framework_TestSuite $suite)
    {
    }
    public function endTestSuite(PHPUnit_Framework_TestSuite $suite)
    {
    }
    public function addRiskyTest(PHPUnit_Framework_Test $test, Exception $e, $time)
    {
    } // Support PHPUnit 3.8+

    /**
     * A test started.
     *
     * @param  PHPUnit_Framework_Test $test
     */
    public function startTest(PHPUnit_Framework_Test $test)
    {
        /** @var $test \PHPUnit_Framework_TestCase */
        $testcase = get_class($test);
        if (strpos($testcase, 'ZendTest\Db') === 0 && strpos($testcase, 'Integration')) {
            $refObj = new \ReflectionObject($test);
            if ($refObj->hasProperty('adapters')) {
                $refProp = $refObj->getProperty('adapters');
                $refProp->setAccessible(true);
                $refProp->setValue($test, $this->adapters);
            }
        }
    }

    /**
     * A test ended.
     *
     * @param  PHPUnit_Framework_Test $test
     * @param  float                  $time
     */
    public function endTest(PHPUnit_Framework_Test $test, $time)
    {
        /** @var $test \PHPUnit_Framework_TestCase */
        $testcase = get_class($test);
        if (strpos($testcase, 'ZendTest\Db') === 0 && strpos($testcase, 'Integration')) {
            $refObj = new \ReflectionObject($test);
            if ($refObj->hasProperty('adapters')) {
                $refProp = $refObj->getProperty('adapters');
                $refProp->setAccessible(true);
                $refProp->setValue($test, []);
            }
        }
    }
}
