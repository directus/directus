<?php

/**
 * Implementation of PostgresAdapterTest.
 * To run these unit-tests an empty test database needs to be setup in database.inc.php
 * and of course, it has to really exist.
 *
 * @category Ruckusing_Tests
 * @package  Ruckusing_Migrations
 * @author   (c) Cody Caughlan <codycaughlan % gmail . com>
 */
class PostgresAdapterTest extends PHPUnit_Framework_TestCase
{
    /**
     * Setup commands before test case
     */
    protected function setUp()
    {
        $ruckusing_config = require RUCKUSING_BASE . '/config/database.inc.php';

        if (!is_array($ruckusing_config) || !(array_key_exists("db", $ruckusing_config) && array_key_exists("pg_test", $ruckusing_config['db']))) {
            $this->markTestSkipped("\n'pg_test' DB is not defined in config/database.inc.php\n\n");
        }

        $test_db = $ruckusing_config['db']['pg_test'];

        //setup our log
        $logger = Ruckusing_Util_Logger::instance(RUCKUSING_BASE . '/tests/logs/test.log');

        $this->adapter = new Ruckusing_Adapter_PgSQL_Base($test_db, $logger);
        $this->adapter->logger->log("Test run started: " . date('Y-m-d g:ia T') );
    }//setUp()

    /**
     * Shutdown commands after test case
     */
    protected function tearDown()
    {
        //delete any tables we created
        if ($this->adapter->has_table('users',true)) {
            $this->adapter->drop_table('users');
        }

        if ($this->adapter->has_table(RUCKUSING_TS_SCHEMA_TBL_NAME,true)) {
            $this->adapter->drop_table(RUCKUSING_TS_SCHEMA_TBL_NAME);
        }

        $db = "test_db";
        //delete any databases we created
        if ($this->adapter->database_exists($db)) {
            $this->adapter->drop_database($db);
        }
    }

    /**
     * test if we can list indexes
     */
    public function test_can_list_indexes()
    {
        $this->adapter->execute_ddl('DROP TABLE IF EXISTS "animals"');
        $this->adapter->execute_ddl("CREATE TABLE animals (id serial primary key, name varchar(32))");
        $this->adapter->execute_ddl("CREATE INDEX idx_animals_on_name ON animals(name)");
        $indexes = $this->adapter->indexes('animals');
        $length = count($indexes);
        $this->assertEquals(1, $length);
        $this->adapter->execute_ddl('DROP TABLE IF EXISTS "animals"');
    }

    /**
     * test create schema version table
     */
    public function test_create_schema_version_table()
    {
        //force drop, start from a clean slate
        if ($this->adapter->has_table(RUCKUSING_TS_SCHEMA_TBL_NAME,true)) {
            $this->adapter->drop_table(RUCKUSING_TS_SCHEMA_TBL_NAME);
        }
        $this->adapter->create_schema_version_table();
        $this->assertEquals(true, $this->adapter->has_table(RUCKUSING_TS_SCHEMA_TBL_NAME,true) );
    }

    /**
     * test if we can dump the current schema
     */
    public function test_can_dump_schema()
    {
        $this->adapter->execute_ddl('DROP TABLE IF EXISTS "animals"');
        $this->adapter->execute_ddl("CREATE TABLE animals (id serial primary key, name varchar(32))");
        $this->adapter->execute_ddl("CREATE INDEX idx_animals_on_name ON animals(name)");
        $file = RUCKUSING_BASE . '/tests/logs/schema.txt';
        $this->adapter->schema($file);
        $this->assertFileExists($file);
        if (file_exists($file)) {
            unlink($file);
        }
        $this->adapter->execute_ddl('DROP TABLE IF EXISTS "animals"');
    }

    /**
     * test to ensure table does not exist
     */
    public function test_ensure_table_does_not_exist()
    {
        $this->assertEquals(false, $this->adapter->has_table('unknown_table') );
    }

    /**
     * test to ensure table does exist
     */
    public function test_ensure_table_does_exist()
    {
        //first make sure the table does not exist
        $users = $this->adapter->has_table('users', true);
        $this->assertEquals(false, $users);
        $t1 = new Ruckusing_Adapter_PgSQL_TableDefinition($this->adapter, "users");
        $t1->column("email", "string", array('limit' => 20));
        $sql = $t1->finish();

        $users = $this->adapter->table_exists('users', true);
        $this->assertEquals(true, $users);
        $this->drop_table('users');
    }

    /**
     * test dropping table
     */
    private function drop_table($table)
    {
        if ($this->adapter->has_table($table,true)) {
            $this->adapter->drop_table($table);
        }
    }

    /**
     * test db creation
     */
    public function test_database_creation()
    {
        $db = "test_db";
        $this->assertEquals(true, $this->adapter->create_database($db) );
        $this->assertEquals(true, $this->adapter->database_exists($db) );

        $db = "db_does_not_exist";
        $this->assertEquals(false, $this->adapter->database_exists($db) );
    }

    /**
     * test dropping database
     */
    public function test_database_droppage()
    {
        $db = "test_db";
        //create it
        $this->assertEquals(true, $this->adapter->create_database($db) );
        $this->assertEquals(true, $this->adapter->database_exists($db) );

        //drop it
        $this->assertEquals(true, $this->adapter->drop_database($db) );
        $this->assertEquals(false, $this->adapter->database_exists($db) );
    }

    /**
     * test index name too long
     */
    public function test_index_name_too_long_throws_exception()
    {
        $bm = new Ruckusing_Migration_Base($this->adapter);
        try {
            srand();
            $table_name = "users_" . rand(0, 1000000);
            $table = $bm->create_table($table_name, array('id' => false));
            $table->column('somecolumnthatiscrazylong', 'integer');
            $table->column('anothercolumnthatiscrazylongrodeclown', 'integer');
            $sql = $table->finish();
            $bm->add_index($table_name, array('somecolumnthatiscrazylong', 'anothercolumnthatiscrazylongrodeclown'));
        } catch (Ruckusing_Exception $exception) {
            if (Ruckusing_Exception::INVALID_INDEX_NAME == $exception->getCode()) {
                $bm->drop_table($table_name);

                return;
            }
        }
        $this->fail('Expected to raise & catch Ruckusing_Exception::INVALID_INDEX_NAME');
    }

    /**
     * test custom primary key 1
     */
    public function test_custom_primary_key_1()
    {
        $this->drop_table('users');
        $t1 = new Ruckusing_Adapter_PgSQL_TableDefinition($this->adapter, "users", array('id' => true) );
        $t1->column("user_id", "integer", array("primary_key" => true));
        $table_create_sql = $t1->finish(true);
        $this->drop_table('users');
    }

    /**
     * test column definition
     */
    public function test_column_definition()
    {
        $expected = '"age" varchar(255)';
        $this->assertEquals($expected, $this->adapter->column_definition("age", "string"));

        $expected = '"age" varchar(32)';
        $this->assertEquals($expected, $this->adapter->column_definition("age", "string", array('limit' => 32)));

        $expected = '"age" varchar(32) NOT NULL';
        $this->assertEquals($expected, $this->adapter->column_definition("age", "string", array('limit' => 32, 'null' => false)));

        $expected = '"age" varchar(32) DEFAULT \'abc\' NOT NULL';
        $this->assertEquals($expected, $this->adapter->column_definition("age", "string", array('limit' => 32, 'default' => 'abc', 'null' => false)));

        $expected = '"age" varchar(32) DEFAULT \'abc\'';
        $this->assertEquals($expected, $this->adapter->column_definition("age", "string", array('limit' => 32, 'default' => 'abc')));

        $expected = '"age" integer';
        $this->assertEquals($expected, $this->adapter->column_definition("age", "integer"));

        $expected = '"age" integer';
        $this->assertEquals($expected, $this->adapter->column_definition("age", "mediuminteger"));

        $expected = '"weight" smallint(1)';
        $this->assertEquals($expected, $this->adapter->column_definition("weight", "tinyinteger", array('limit' => 1)));

        $expected = '"active" boolean';
        $this->assertEquals($expected, $this->adapter->column_definition("active", "boolean"));

        $expected = '"weight" bigint';
        $this->assertEquals($expected, $this->adapter->column_definition("weight", "biginteger"));

        $expected = '"age" text';
        $this->assertEquals($expected, $this->adapter->column_definition("age", "tinytext"));

	$expected = '"age" bytea';
	$this->assertEquals($expected, $this->adapter->column_definition("age", "longbinary"));

    }

    /**
     * test column info
     */
    public function test_column_info()
    {
        $table = $this->adapter->create_table('users');
        $table->column('name', 'string', array('limit' => 20));
        $table->finish();

        $expected = array();
        $actual = $this->adapter->column_info("users", "name");
        $this->assertEquals('character varying(20)', $actual['type'] );
        $this->assertEquals('name', $actual['field'] );
        $this->drop_table('users');
    }

    /**
     * test renaming table
     */
    public function test_rename_table()
    {
        $this->adapter->drop_table('users');
        $this->adapter->drop_table('users_new');
        //create it
        $table = $this->adapter->create_table('users');
        $table->column('name', 'string', array('limit' => 20));
        $table->finish();

        $this->assertEquals(true, $this->adapter->has_table('users') );
        $this->assertEquals(false, $this->adapter->has_table('users_new') );
        //rename it
        $this->adapter->rename_table('users', 'users_new');
        $this->assertEquals(false, $this->adapter->has_table('users') );
        $this->assertEquals(true, $this->adapter->has_table('users_new') );
        //clean up
        $this->adapter->drop_table('users');
        $this->adapter->drop_table('users_new');
    }

    /**
     * test renaming column
     */
    public function test_rename_column()
    {
        $this->adapter->drop_table('users');
        //create it
        $table = $this->adapter->create_table('users');
        $table->column('name', 'string', array('limit' => 20));
        $table->finish();

        $before = $this->adapter->column_info("users", "name");
        $this->assertEquals('character varying(20)', $before['type'] );
        $this->assertEquals('name', $before['field'] );

        //rename the name column
        $this->adapter->rename_column('users', 'name', 'new_name');

        $after = $this->adapter->column_info("users", "new_name");
        $this->assertEquals('character varying(20)', $after['type'] );
        $this->assertEquals('new_name', $after['field'] );
        $this->drop_table('users');
    }

    /**
     * test adding column
     */
    public function test_add_column()
    {
        //create it
        $table = $this->adapter->create_table('users');
        $table->column('name', 'string', array('limit' => 20));
        $table->finish();

        $col = $this->adapter->column_info("users", "name");
        $this->assertEquals("name", $col['field']);

        //add column
        $this->adapter->add_column("users", "fav_color", "string", array('limit' => 32));
        $col = $this->adapter->column_info("users", "fav_color");
        $this->assertEquals("fav_color", $col['field']);
        $this->assertEquals('character varying(32)', $col['type'] );

        //add column
        $this->adapter->add_column("users", "latitude", "decimal", array('precision' => 10, 'scale' => 2));
        $col = $this->adapter->column_info("users", "latitude");
        $this->assertEquals("latitude", $col['field']);
        $this->assertEquals('numeric(10,2)', $col['type'] );

        //add column with unsigned parameter
        $this->adapter->add_column("users", "age", "integer", array('limit' => 2)); // the limit will be ignored
        $col = $this->adapter->column_info("users", "age");
        $this->assertEquals("age", $col['field']);
        $this->assertEquals('integer', $col['type'] );

        //add column with biginteger datatype
        $this->adapter->add_column("users", "weight", "biginteger");
        $col = $this->adapter->column_info("users", "weight");
        $this->assertEquals("weight", $col['field']);
        $this->assertEquals('bigint', $col['type'] );
        $this->drop_table('users');
    }

    /**
     * test dropping column
     */
    public function test_remove_column()
    {
        $this->drop_table('users');
        //create it
        $table = $this->adapter->create_table('users');
        $table->column('name', 'string', array('limit' => 20));
        $table->column('age', 'integer');
        $table->finish();

        //verify it exists
        $col = $this->adapter->column_info("users", "name");
        $this->assertEquals("name", $col['field']);

        //drop it
        $this->adapter->remove_column("users", "name");

        //verify it does not exist
        $col = $this->adapter->column_info("users", "name");
        $this->assertEquals(array(), $col);
        $this->drop_table('users');
    }

    /**
     * test changing column
     */
    public function test_change_column()
    {
        //create it
        $table = $this->adapter->create_table('users');
        $table->column('name', 'string', array('limit' => 20));
        $table->column('age', 'integer');
        $table->finish();

        //verify its type
        $col = $this->adapter->column_info("users", "name");
        $this->assertEquals('character varying(20)', $col['type'] );
        $this->assertEquals('', $col['default'] );

        //change it, add a default too!
        $this->adapter->change_column("users", "name", "string", array('default' => 'abc', 'limit' => 128));

        $col = $this->adapter->column_info("users", "name");
        $this->assertEquals('character varying(128)', $col['type'] );
        $this->assertEquals("'abc'::character varying", $col['default'] );
        $this->drop_table('users');
    }

    /**
     * test adding index
     */
    public function test_add_index()
    {
        //create it
        $table = $this->adapter->create_table('users');
        $table->column('name', 'string', array('limit' => 20));
        $table->column('title', 'string', array('limit' => 20));
        $table->column('age', 'integer');
        $table->finish();

        $this->adapter->add_index("users", "name");

        $this->assertEquals(true, $this->adapter->has_index("users", "name") );
        $this->assertEquals(false, $this->adapter->has_index("users", "age") );

        $this->adapter->add_index("users", "age", array('unique' => true));
        $this->assertEquals(true, $this->adapter->has_index("users", "age") );

        $this->adapter->add_index("users", "title", array('name' => 'index_on_super_title'));
        $this->assertEquals(true, $this->adapter->has_index("users", "title", array('name' => 'index_on_super_title')));
        $this->adapter->remove_index("users", array("name", "age"), array('name' => 'index_on_super_title'));
        $this->assertEquals(false, $this->adapter->has_index("users", "title", array('name' => 'index_on_super_title')));

        $this->drop_table('users');
    }

    /**
     * test multi column index
     */
    public function test_multi_column_index()
    {
        //create it
        $table = $this->adapter->create_table('users');
        $table->column('name', 'string', array('limit' => 20));
        $table->column('age', 'integer');
        $table->finish();
        $this->adapter->add_index("users", array("name", "age"));

        $this->assertEquals(true, $this->adapter->has_index("users", array("name", "age") ));

        //drop it
        $this->adapter->remove_index("users", array("name", "age"));
        $this->assertEquals(false, $this->adapter->has_index("users", array("name", "age") ));
        $this->drop_table('users');
    }

    /**
     * test remove index with default index name
     */
    public function test_remove_index_with_default_index_name()
    {
        $table = $this->adapter->create_table('users');
        $table->column('name', 'string', array('limit' => 20));
        $table->column('age', 'integer');
        $table->finish();

        //$this->adapter->execute_ddl("CREATE TABLE users ( name varchar(20), age int(3) );");
        $this->adapter->add_index("users", "name");

        $this->assertEquals(true, $this->adapter->has_index("users", "name") );

        //drop it
        $this->adapter->remove_index("users", "name");
        $this->assertEquals(false, $this->adapter->has_index("users", "name") );
        $this->drop_table('users');
    }

    /**
     * test remove index with custom index name
     */
    public function test_remove_index_with_custom_index_name()
    {
        //create it
        $table = $this->adapter->create_table('users');
        $table->column('name', 'string', array('limit' => 20));
        $table->column('age', 'integer');
        $table->finish();

        $this->adapter->add_index("users", "name", array('name' => 'my_special_index'));

        $this->assertEquals(true, $this->adapter->has_index("users", "name", array('name' => 'my_special_index')) );

        //drop it
        $this->adapter->remove_index("users", "name", array('name' => 'my_special_index'));
        $this->assertEquals(false, $this->adapter->has_index("users", "name", array('name' => 'my_special_index')) );
        $this->drop_table('users');
    }

    /**
     * test select all and returning
     */
    public function test_select_all_and_returning()
    {
        $table = $this->adapter->create_table('users');
        $table->column('name', 'string', array('limit' => 20));
        $table->column('age', 'integer');
        $table->finish();

        $id1 = $this->adapter->query(sprintf("INSERT INTO users (name, age) VALUES ('%s', %d) RETURNING \"id\"", 'Taco', 32));
        $this->assertEquals(1, $id1);
        $id2 = $this->adapter->query(sprintf("INSERT INTO users (name, age) VALUES ('%s', %d) RETURNING \"id\"", 'Bumblebee', 76));
        $this->assertEquals(2, $id2);
        $results = $this->adapter->select_all('SELECT * FROM users ORDER BY name ASC');
        $this->assertEquals(2, count($results));
        $first = $results[0];
        $this->assertEquals('Bumblebee', $first['name']);
        $this->assertEquals(76, $first['age']);
        $second = $results[1];
        $this->assertEquals('Taco', $second['name']);
        $this->assertEquals(32, $second['age']);

        $this->drop_table('users');
    }

    /**
     * test select one
     */
    public function test_select_one()
    {
        $table = $this->adapter->create_table('users');
        $table->column('name', 'string', array('limit' => 20));
        $table->column('age', 'integer');
        $table->finish();

        $id1 = $this->adapter->query(sprintf("INSERT INTO users (name, age) VALUES ('%s', %d) RETURNING \"id\"", 'Taco', 32));
        $this->assertEquals(1, $id1);

        $result = $this->adapter->select_one(sprintf("SELECT * FROM users WHERE name = '%s'", 'Taco'));
        $this->assertEquals(true, is_array($result));
        $this->assertEquals('Taco', $result['name']);
        $this->assertEquals(32, $result['age']);

        $this->drop_table('users');
    }

}//class
