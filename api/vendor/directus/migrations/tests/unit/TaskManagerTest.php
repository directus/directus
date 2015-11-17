<?php

/**
 * Implementation of TaskManagerTest.
 * To run these unit-tests an empty test database needs to be setup in database.inc.php
 * and of course, it has to really exist.
 *
 * @category Ruckusing_Tests
 * @package  Ruckusing_Migrations
 * @author   (c) Cody Caughlan <codycaughlan % gmail . com>
 */
class TaskManagerTest extends PHPUnit_Framework_TestCase
{
    /**
     * Setup commands before test case
     */
    protected function setUp()
    {
        $ruckusing_config = require RUCKUSING_BASE . '/config/database.inc.php';

        if (!is_array($ruckusing_config) || !(array_key_exists("db", $ruckusing_config) && array_key_exists("mysql_test", $ruckusing_config['db']))) {
            $this->markTestSkipped("\n'mysql_test' DB is not defined in config/database.inc.php\n\n");
        }

        $test_db = $ruckusing_config['db']['mysql_test'];
        //setup our log
        $logger = Ruckusing_Util_Logger::instance(RUCKUSING_BASE . '/tests/logs/test.log');

        $this->adapter = new Ruckusing_Adapter_MySQL_Base($test_db, $logger);
        $this->adapter->logger->log("Test run started: " . date('Y-m-d g:ia T'));

        $this->framework = new Ruckusing_FrameworkRunner($ruckusing_config, array('ENV=mysql_test'));
        $this->db_dir = $this->framework->db_directory();
        if (!is_dir($this->db_dir)) {
            mkdir($this->db_dir, 0755, true);
        }

    } //setUp()

    /**
     * test db schema creation
     */
    public function test_db_schema_creation()
    {
        $schema = new Task_Db_Schema($this->adapter);
        $schema->set_framework($this->framework);
        $schema->execute(array());
        $this->assertEquals(true, file_exists($this->db_dir . '/schema.txt'));
    }
}
