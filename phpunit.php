<?php

$loader = require __DIR__ . '/vendor/autoload.php';

define_constant('BASE_PATH', __DIR__);
define_constant('DIRECTUS_PATH', '/');
define_constant('STATUS_COLUMN_NAME', 'active');
define_constant('DIRECTUS_ENV', 'development');

// force a timezone
date_default_timezone_set('America/New_York');

/**
 * @param $testCase
 * @param $attributes - mock attributes
 *
 * @return \Zend\Db\Adapter\Adapter
 */
function get_mock_adapter($testCase, $attributes = [])
{
    $mockDriver = get_mock_driver($testCase, $attributes);

    // setup mock adapter
    $mockAdapter = $testCase->getMock('Zend\Db\Adapter\Adapter', null, [$mockDriver]);

    return $mockAdapter;
}

function get_mock_connection($testCase, $attributes = [])
{
    $mockDriver = get_mock_driver($testCase, $attributes);

    // setup mock connection adapter
    $mockConnectionAdapter = $testCase->getMock('Directus\Database\Connection', null, [$mockDriver]);

    return $mockConnectionAdapter;
}

function get_mock_driver($testCase, $attributes = [])
{
    $resultCount = 0;
    if (isset($attributes['result_count'])) {
        $resultCount = (int)$attributes['result_count'];
    }

    $resultData = null;
    if (isset($attributes['result_data'])) {
        $resultData = $attributes['result_data'];
    }

    $platformName = 'Mysql';
    if (isset($attributes['platform_name'])) {
        $platformName = $attributes['platform_name'];
    }

    // mock the adapter, driver, and parts
    $mockResult = $testCase->getMock('Zend\Db\Adapter\Driver\ResultInterface');
    $mockResult->expects($testCase->any())->method('count')->will($testCase->returnValue($resultCount));
    $mockResult->expects($testCase->any())->method('current')->will($testCase->returnValue($resultData));
    $mockStatement = $testCase->getMock('Zend\Db\Adapter\Driver\StatementInterface');
    $mockStatement->expects($testCase->any())->method('execute')->will($testCase->returnValue($mockResult));

    // Connection
    $mockConnection = $testCase->getMock('Zend\Db\Adapter\Driver\ConnectionInterface');
    $mockConnection->expects($testCase->any())->method('getCurrentSchema')->will($testCase->returnValue('directus_schema'));
    // $mockConnection->expects($testCase->any())->method('getDatabasePlatformName')->will($testCase->returnValue($platformName));
    // $mockConnection->expects($testCase->any())->method('getDriverName')->will($testCase->returnValue($platformName));

    $mockDriver = $testCase->getMock('Zend\Db\Adapter\Driver\DriverInterface');
    $mockDriver->expects($testCase->any())->method('createStatement')->will($testCase->returnValue($mockStatement));
    $mockDriver->expects($testCase->any())->method('getConnection')->will($testCase->returnValue($mockConnection));
    $mockDriver->expects($testCase->any())->method('getDatabasePlatformName')->will($testCase->returnValue($platformName));

    return $mockDriver;
}

function get_mysql_schema($testCase, $attributes = [])
{
    $mockAdapter = get_mock_adapter($testCase, $attributes);

    return new \Directus\Database\Schemas\Sources\MySQLSchema($mockAdapter);
}

function get_mock_mysql_schema($testCase, $methods = [])
{
    $mockAdapter = get_mock_adapter($testCase);
    $mockSchema = $testCase->getMockBuilder('\Directus\Database\Schemas\Sources\MySQLSchema')
        ->setConstructorArgs([$mockAdapter])
        ->setMethods($methods)
        ->getMock();

    return $mockSchema;
}

function get_array_session()
{
    $storage = new \Directus\Session\Storage\ArraySessionStorage();

    return new \Directus\Session\Session($storage);
}
