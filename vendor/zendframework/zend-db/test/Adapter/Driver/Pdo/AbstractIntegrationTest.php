<?php
///**
// * Zend Framework (http://framework.zend.com/)
// *
// * @link      http://github.com/zendframework/zf2 for the canonical source repository
// * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
// * @license   http://framework.zend.com/license/new-bsd New BSD License
// */
//
//namespace ZendTest\Db\Adapter\Driver\Pdo;
//
//abstract class AbstractIntegrationTest extends \PHPUnit_Framework_TestCase
//{
//
//    /**
//     * Sets up the fixture, for example, opens a network connection.
//     * This method is called before a test is executed.
//     */
//    protected function setUp()
//    {
//        foreach ($this->variables as $name => $value) {
//            if (!getenv($value)) {
//                $this->markTestSkipped('Missing required variable ' . $value . ' from phpunit.xml for this integration test');
//            }
//            $this->variables[$name] = getenv($value);
//        }
//
//        if (!extension_loaded('sqlsrv')) {
//            $this->fail('The phpunit group integration-sqlsrv was enabled, but the extension is not loaded.');
//        }
//    }
//}
