<?php

/**
 * Implementation of MigratorUtilTest
 * To run these unit-tests an empty test database needs to be setup in database.inc.php
 * and of course, it has to really exist.
 *
 * @category Ruckusing_Tests
 * @package  Ruckusing_Migrations
 * @author   (c) Cody Caughlan <codycaughlan % gmail . com>
*/
class MigratorUtilTestSingleDirectory extends PHPUnit_Framework_TestCase
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
        $this->adapter->logger->log("Test run started: " . date('Y-m-d g:ia T') );

        //create the schema table if necessary
        $this->adapter->create_schema_version_table();

        $framework = new Ruckusing_FrameworkRunner($ruckusing_config, array('ENV=mysql_test', 'module=default'));
        $this->migrations_dirs = $framework->migrations_directories();
        // need to deal with array, not just string at main
        if (!is_dir($this->migrations_dirs['default'])) {
            mkdir($this->migrations_dirs['default'], 0755, true);
        }
    }//setUp()

    /**
     * shutdown commands after test case
     */
    protected function tearDown()
    {
        //clear out any tables we populated
        $this->adapter->query('DELETE FROM ' . RUCKUSING_TS_SCHEMA_TBL_NAME);
    }

    /**
     * Insert dummy data in db
     *
     * @param array $data array of data to insert
     */
    private function insert_dummy_version_data($data)
    {
        foreach ($data as $version) {
            $insert_sql = sprintf("INSERT INTO %s (version) VALUES ('%s')", RUCKUSING_TS_SCHEMA_TBL_NAME, $version);
            $this->adapter->query($insert_sql);
        }
    }

    /**
     * Clear dummy data in db
     */
    private function clear_dummy_data()
    {
        $this->adapter->query('DELETE FROM ' . RUCKUSING_TS_SCHEMA_TBL_NAME);
    }

    /**
     * test getting the current max version
     */
    public function test_get_max_version()
    {
        $migrator_util = new Ruckusing_Util_Migrator($this->adapter);

        $this->clear_dummy_data();
        $this->assertEquals(null, $migrator_util->get_max_version());

        $this->insert_dummy_version_data(array(3));
        $this->assertEquals("3", $migrator_util->get_max_version());
        $this->clear_dummy_data();
    }

    /**
     * test resolve current version going up
     */
    public function test_resolve_current_version_going_up()
    {
        $this->clear_dummy_data();
        $this->insert_dummy_version_data( array(1));

        $migrator_util = new Ruckusing_Util_Migrator($this->adapter);
        $migrator_util->resolve_current_version(3, 'up');

        $executed = $migrator_util->get_executed_migrations();
        $this->assertEquals(true, in_array(3, $executed));
        $this->assertEquals(true, in_array(1, $executed));
        $this->assertEquals(false, in_array(2, $executed));
    }

    /**
     * test resolve current version going down
     */
    public function test_resolve_current_version_going_down()
    {
        $this->clear_dummy_data();
        $this->insert_dummy_version_data(array(1,2,3));

        $migrator_util = new Ruckusing_Util_Migrator($this->adapter);
        $migrator_util->resolve_current_version(3, 'down');

        $executed = $migrator_util->get_executed_migrations();
        $this->assertEquals(false, in_array(3, $executed));
        $this->assertEquals(true, in_array(1, $executed));
        $this->assertEquals(true, in_array(2, $executed));
    }

    /**
     * test no target version with runnable migrations going up
     */
    public function test_get_runnable_migrations_going_up_no_target_version()
    {
        $migrator_util = new Ruckusing_Util_Migrator($this->adapter);
        $actual_up_files = $migrator_util->get_runnable_migrations($this->migrations_dirs, 'up', false);
        $expect_up_files = array(
                array(
                        'version' => 1,
                        'class' => 'CreateUsers',
                        'file' => '001_CreateUsers.php',
                        'module' => 'default'
                ),
                array(
                        'version' => 3,
                        'class' => 'AddIndexToBlogs',
                        'file' => '003_AddIndexToBlogs.php',
                        'module' => 'default'
                ),
                array(
                        'version' => '20090122193325',
                        'class'   => 'AddNewTable',
                        'file'    => '20090122193325_AddNewTable.php',
                        'module' => 'default'
                )
        );
        $this->assertEquals($expect_up_files, $actual_up_files);
    }

    /**
     * test no target version with runnable migrations going down
     */
    public function test_get_runnable_migrations_going_down_no_target_version()
    {
        $migrator_util = new Ruckusing_Util_Migrator($this->adapter);
        $actual_down_files  = $migrator_util->get_runnable_migrations($this->migrations_dirs, 'down', false);
        $this->assertEquals(array() , $actual_down_files);
    }

    /**
     * test target version with runnable migrations going up, no current version
     */
    public function test_get_runnable_migrations_going_up_with_target_version_no_current()
    {
        $migrator_util = new Ruckusing_Util_Migrator($this->adapter);
        $actual_up_files = $migrator_util->get_runnable_migrations($this->migrations_dirs, 'up', 3, false);
        $expect_up_files = array(
                array(
                        'version' => 1,
                        'class' => 'CreateUsers',
                        'file'  => '001_CreateUsers.php',
                        'module' => 'default'
                ),
                array(
                        'version' => 3,
                        'class' => 'AddIndexToBlogs',
                        'file'  => '003_AddIndexToBlogs.php',
                        'module' => 'default'
                )
        );
        $this->assertEquals($expect_up_files, $actual_up_files);
    }

    /**
     * test target version with runnable migrations going up, with current version
     */
    public function test_get_runnable_migrations_going_up_with_target_version_with_current()
    {
        $migrator_util = new Ruckusing_Util_Migrator($this->adapter);
        //pretend we already executed version 1
        $this->insert_dummy_version_data(array(1));
        $actual_up_files = $migrator_util->get_runnable_migrations($this->migrations_dirs, 'up', 3, false);
        $expect_up_files = array(
                array(
                        'version' => 3,
                        'class' => 'AddIndexToBlogs',
                        'file'  => '003_AddIndexToBlogs.php',
                        'module' => 'default'
                )
        );
        $this->assertEquals($expect_up_files, $actual_up_files);
        $this->clear_dummy_data();

        //now pre-register some migrations that we have already executed
        $this->insert_dummy_version_data(array(1, 3));
        $actual_up_files = $migrator_util->get_runnable_migrations($this->migrations_dirs, 'up', 3, false);
        $this->assertEquals(array(), $actual_up_files);
    }

    /**
     * test target version with runnable migrations going down, no current version
     */
    public function test_get_runnable_migrations_going_down_with_target_version_no_current()
    {
        $migrator_util = new Ruckusing_Util_Migrator($this->adapter);
        $this->insert_dummy_version_data(array(3, '20090122193325'));
        $actual_down_files = $migrator_util->get_runnable_migrations($this->migrations_dirs, 'down', 1, false);
        $expect_down_files = array(
                array(
                        'version' => '20090122193325',
                        'class'   => 'AddNewTable',
                        'file'    => '20090122193325_AddNewTable.php',
                        'module' => 'default'
                ),
                array(
                        'version' => 3,
                        'class' => 'AddIndexToBlogs',
                        'file' => '003_AddIndexToBlogs.php',
                        'module' => 'default'
                )
        );
        $this->assertEquals($expect_down_files, $actual_down_files);
        $this->clear_dummy_data();

        $this->insert_dummy_version_data(array(3));
        $actual_down_files = $migrator_util->get_runnable_migrations($this->migrations_dirs, 'down', 1, false);
        $expect_down_files = array(
                array(
                        'version' => 3,
                        'class' => 'AddIndexToBlogs',
                        'file' => '003_AddIndexToBlogs.php',
                        'module' => 'default'
                )
        );
        $this->assertEquals($expect_down_files, $actual_down_files);

        //go all the way down!
        $this->clear_dummy_data();
        $this->insert_dummy_version_data(array(1, 3, '20090122193325'));
        $actual_down_files = $migrator_util->get_runnable_migrations($this->migrations_dirs, 'down', 0, false);
        $expect_down_files = array(
                array(
                        'version' => '20090122193325',
                        'class'   => 'AddNewTable',
                        'file'    => '20090122193325_AddNewTable.php',
                        'module'  => 'default'
                ),
                array(
                        'version' => 3,
                        'class' => 'AddIndexToBlogs',
                        'file' => '003_AddIndexToBlogs.php',
                        'module' => 'default'
                ),
                array(
                        'version' => 1,
                        'class' => 'CreateUsers',
                        'file' => '001_CreateUsers.php',
                        'module' => 'default'
                )
        );
        $this->assertEquals($expect_down_files, $actual_down_files);
    } //test_get_runnable_migrations_going_down_with_target_version_no_current

} // class MigratorUtilTest
