<?php

/**
 * Implementation of BaseMigrationTest.
 * To run these unit-tests an empty test database needs to be setup in database.inc.php
 * and of course, it has to really exist.
 *
 * @category Ruckusing
 * @package  Ruckusing
 * @author   (c) Cody Caughlan <codycaughlan % gmail . com>
 */
class BaseMigrationTest extends PHPUnit_Framework_TestCase
{
    /**
     * Setup commands before test case
     */
    protected function setUp()
    {
        $ruckusing_config = require RUCKUSING_BASE . '/config/database.inc.php';

        if (!is_array($ruckusing_config) || !(array_key_exists("db", $ruckusing_config) && array_key_exists("mysql_test", $ruckusing_config['db']))) {
            die("\n'mysql_test' DB is not defined in config/database.inc.php\n\n");
            //$this->markTestSkipped
        }

        $test_db = $ruckusing_config['db']['mysql_test'];

        //setup our log
        $logger = Ruckusing_Util_Logger::instance(RUCKUSING_BASE . '/tests/logs/test.log');

        $this->adapter = new Ruckusing_Adapter_MySQL_Base($test_db, $logger);
        $this->adapter->logger->log("Test run started: " . date('Y-m-d g:ia T') );
    }//setUp()

    /**
     * shutdown commands after test case
     */
    protected function tearDown()
    {
        //delete any tables we created
        if ($this->adapter->has_table('users', true)) {
            $this->adapter->drop_table('users');
        }

        if ($this->adapter->has_table(RUCKUSING_TS_SCHEMA_TBL_NAME, true)) {
            $this->adapter->drop_table(RUCKUSING_TS_SCHEMA_TBL_NAME);
        }
    }

    /**
     * test case for creating an index with a custom name
     */
    public function test_can_create_index_with_custom_name()
    {
        //create it
        $this->adapter->execute_ddl("CREATE TABLE `users` ( name varchar(20), age int(3) );");
        $base = new Ruckusing_Migration_Base($this->adapter);
        $base->add_index("users", "name", array('name' => 'my_special_index'));

        //ensure it exists
        $this->assertEquals(true, $this->adapter->has_index("users", "name", array('name' => 'my_special_index')));

        //drop it
        $base->remove_index("users", "name", array('name' => 'my_special_index'));
        $this->assertEquals(false, $this->adapter->has_index("users", "my_special_index"));
    }

    /**
     * test executing multiple queries
     * important: this function using sql for mysql only, though its test should prove it works for other adapters
     */
    public function test_execute_multiple_queries()
    {
        // Create it
        $base = new Ruckusing_Migration_Base($this->adapter);

        // test with output from phpmyadmin
        $base->execute("
drop table if exists `admin`;
create table `admin` (
  `id` int(11) not null auto_increment,
  `email` varchar(100) collate utf8_unicode_ci default null,
  `name` varchar(100) collate utf8_unicode_ci default null,
  `salt` varchar(10) collate utf8_unicode_ci default null,
  `password_hash` varchar(64) collate utf8_unicode_ci default null,
  `status` varchar(20) collate utf8_unicode_ci default 'inactive',
  `receives_order_email` tinyint(1) default true,
  `created_at` timestamp,
  `updated_at` timestamp,
  primary key (`id`)
) engine=innodb default charset=utf8 collate=utf8_unicode_ci;

drop table if exists `adminsession`;
create table `adminsession` (
  `id` int(11) not null auto_increment,
  `admin_id` int(11) default null,
  `session_id` varchar(32) collate utf8_unicode_ci default null,
  `created_at` timestamp,
  `updated_at` timestamp,
  primary key (`id`)
) engine=innodb default charset=utf8 collate=utf8_unicode_ci;
        ");

        // test first table created ok
        $col = $this->adapter->column_info("admin", "email");
        $this->assertEquals("email", $col['field']);

        // test second table created ok
        $col = $this->adapter->column_info("adminsession", "admin_id");
        $this->assertEquals("admin_id", $col['field']);

        // test multiple queries with a semicolon inside quotes
        $base->execute("
            DROP TABLE IF EXISTS `demo`;
            CREATE TABLE `demo` (
              `id` INT(11) NOT NULL AUTO_INCREMENT,
              `name` VARCHAR(100) NOT NULL,
              PRIMARY KEY (`id`)
            );
            INSERT INTO demo(id, name) VALUES(1,'A;A');
            INSERT INTO demo(id, name) VALUES(2,'b;b');
        ");
        $rows = $this->adapter->select_all('SELECT * FROM demo');
        $this->assertEquals(2, count($rows));

        // cleanup
        $base->execute("DROP TABLE `admin`; DROP TABLE `adminsession`; DROP TABLE `demo`;");
        
    }
}
