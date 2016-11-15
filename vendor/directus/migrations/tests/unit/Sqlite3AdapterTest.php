<?php

/**
 * @category Ruckusing_Tests
 * @package  Ruckusing_Migrations
 * @author   (c) Andrzej Oczkowicz <andrzejoczkowicz % gmail . com>
 */
class Sqlite3AdapterTest extends PHPUnit_Framework_TestCase
{
    /**
     * @var $adapter Ruckusing_Adapter_Sqlite3_Base
     */
    private $adapter;

    protected function setUp()
    {
        parent::setUp();
        $ruckusing_config = require RUCKUSING_BASE . '/config/database.inc.php';

        if (!is_array($ruckusing_config) || !(array_key_exists("db", $ruckusing_config) && array_key_exists("sqlite_test", $ruckusing_config['db']))) {
            $this->markTestSkipped("\n'sqlite_test' DB is not defined in config/database.inc.php\n\n");
        }

        $test_db = $ruckusing_config['db']['sqlite_test'];

        $logger = Ruckusing_Util_Logger::instance(RUCKUSING_BASE . '/tests/logs/test.log');

        $this->adapter = new Ruckusing_Adapter_Sqlite3_Base($test_db, $logger);
        $this->adapter->logger->log("Test run started: " . date('Y-m-d g:ia T'));
        $this->adapter->query('DROP TABLE IF EXISTS test');
        $this->adapter->query('CREATE TABLE test(id int)');
    }

    protected function tearDown()
    {
        if ($this->adapter->has_table('users', true)) {
            $this->adapter->drop_table('users');
        }

        if ($this->adapter->has_table(RUCKUSING_TS_SCHEMA_TBL_NAME, true)) {
            $this->adapter->drop_table(RUCKUSING_TS_SCHEMA_TBL_NAME);
        }

        $this->adapter->query('DROP TABLE IF EXISTS test');
        parent::tearDown();
    }

    public function test_select_one()
    {
        $table = $this->adapter->create_table('users');
        $table->column('name', 'string', array('limit' => 20));
        $table->column('age', 'integer');
        $table->finish();

        $id1 = $this->adapter->query(sprintf("INSERT INTO users (name, age) VALUES ('%s', %d)", 'Taco', 32));
        $this->assertEquals(1, $id1);

        $result = $this->adapter->select_one(sprintf("SELECT * FROM users WHERE name = '%s'", 'Taco'));
        $this->assertEquals(true, is_array($result));
        $this->assertEquals('Taco', $result['name']);
        $this->assertEquals(32, $result['age']);

        $this->adapter->drop_table('users');
    }

    public function test_query_create()
    {
        $this->adapter->query('INSERT INTO test(id) VALUES(1)');

        $id = $this->adapter->query('SELECT id FROM test LIMIT 1');
        $this->assertEquals(1, $id[0]['id']);
    }

    public function test_convert_native_types()
    {
        $sql = $this->adapter->type_to_sql('string');

        $this->assertEquals('varchar(255)', $sql);
    }

    public function test_convert_native_types_limit()
    {
        $sql = $this->adapter->type_to_sql('string', array('limit' => 50));

        $this->assertEquals('varchar(50)', $sql);
    }

    public function test_table_exists()
    {
        $this->assertTrue($this->adapter->table_exists('test'));
        $this->assertFalse($this->adapter->table_exists('not_existing_table'));
    }

    public function test_rename_existing_table()
    {
        $this->adapter->query('DROP TABLE IF EXISTS test1234');

        $this->assertTrue($this->adapter->rename_table('test', 'test1234'));

        $this->assertFalse($this->adapter->table_exists('test'));
        $this->assertTrue($this->adapter->table_exists('test1234'));

        $this->adapter->query('DROP TABLE IF EXISTS test1234');
    }

    public function test_add_new_column()
    {
        $this->assertTrue($this->adapter->add_column('test', 'name', 'string', array('limit' => 10)));
        $this->assertEquals(array(
            'name' => 'name',
            'type' => 'varchar(10)',
            'field' => 'name',
            'null' => 1,
            'default' => null
        ), $this->adapter->column_info('test', 'name'));
    }

    public function test_can_list_indexes()
    {
        $this->adapter->execute_ddl('DROP TABLE IF EXISTS "animals"');
        $this->adapter->execute_ddl("CREATE TABLE animals (id integer primary key, name varchar(32))");
        $this->adapter->execute_ddl("CREATE INDEX idx_animals_on_name ON animals(name)");
        $indexes = $this->adapter->indexes('animals');
        $length = count($indexes);
        $this->assertEquals(1, $length);
        $this->adapter->execute_ddl('DROP TABLE IF EXISTS "animals"');
    }

    public function test_create_schema_version_table()
    {
        //force drop, start from a clean slate
        if ($this->adapter->table_exists(RUCKUSING_TS_SCHEMA_TBL_NAME, true)) {
            $this->adapter->drop_table(RUCKUSING_TS_SCHEMA_TBL_NAME);
        }
        $this->adapter->create_schema_version_table();
        $this->assertEquals(true, $this->adapter->table_exists(RUCKUSING_TS_SCHEMA_TBL_NAME, true));
    }

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

    public function test_ensure_table_does_not_exist()
    {
        $this->assertEquals(false, $this->adapter->has_table('unknown_table'));
    }

    public function test_ensure_table_does_exist()
    {
        //first make sure the table does not exist
        $users = $this->adapter->has_table('users', true);
        $this->assertEquals(false, $users);
        $t1 = new Ruckusing_Adapter_Sqlite3_TableDefinition($this->adapter, "users");
        $t1->column("email", "string", array('limit' => 20));
        $sql = $t1->finish();

        $users = $this->adapter->table_exists('users', true);
        $this->assertEquals(true, $users);
        $this->drop_table('users');
    }

    private function drop_table($table)
    {
        if ($this->adapter->has_table($table, true)) {
            $this->adapter->drop_table($table);
        }
    }

    public function test_database_creation()
    {
        $this->markTestSkipped('In sqlite create database is unsupported - http://www.sqlite.org');
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

    public function test_custom_primary_key_1()
    {
        $this->drop_table('users');
        $t1 = new Ruckusing_Adapter_Sqlite3_TableDefinition($this->adapter, "users", array('id' => true));
        $t1->column("user_id", "integer", array("primary_key" => true));
        $t1->finish(true);
        $this->drop_table('users');
    }

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

        $expected = '"age" blob';
        $this->assertEquals($expected, $this->adapter->column_definition("age", "longbinary"));

    }

    public function test_column_info()
    {
        $table = $this->adapter->create_table('users');
        $table->column('name', 'string', array('limit' => 20));
        $table->finish();

        $actual = $this->adapter->column_info("users", "name");
        $this->assertEquals('varchar(20)', $actual['type']);
        $this->assertEquals('name', $actual['field']);
        $this->drop_table('users');
    }

    public function test_rename_table()
    {
        $this->adapter->drop_table('users');
        $this->adapter->drop_table('users_new');
        //create it
        $table = $this->adapter->create_table('users');
        $table->column('name', 'string', array('limit' => 20));
        $table->finish();

        $this->assertTrue($this->adapter->has_table('users'));
        $this->assertFalse($this->adapter->has_table('users_new'));
        //rename it
        $this->adapter->rename_table('users', 'users_new');
        $this->assertFalse($this->adapter->has_table('users'));
        $this->assertTrue($this->adapter->has_table('users_new'));
        //clean up
        $this->adapter->drop_table('users');
        $this->adapter->drop_table('users_new');
    }

    public function test_rename_column()
    {
        $this->markTestSkipped('In sqlite alter columns operations are unsupported - http://www.sqlite.org/omitted.html');
    }

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
        $this->assertEquals('varchar(32)', $col['type']);

        //add column
        $this->adapter->add_column("users", "latitude", "decimal", array('precision' => 10, 'scale' => 2));
        $col = $this->adapter->column_info("users", "latitude");
        $this->assertEquals("latitude", $col['field']);
        $this->assertEquals('decimal', $col['type']);

        //add column with unsigned parameter
        $this->adapter->add_column("users", "age", "integer", array('limit' => 2)); // the limit will be ignored
        $col = $this->adapter->column_info("users", "age");
        $this->assertEquals("age", $col['field']);
        $this->assertEquals('integer(2)', $col['type']);

        //add column with biginteger datatype
        $this->adapter->add_column("users", "weight", "biginteger");
        $col = $this->adapter->column_info("users", "weight");
        $this->assertEquals("weight", $col['field']);
        $this->assertEquals('bigint', $col['type']);
        $this->drop_table('users');
    }

    public function test_remove_column()
    {
        $this->markTestSkipped('In sqlite alter columns operations are unsupported - http://www.sqlite.org/omitted.html');
    }

    public function test_change_column()
    {
        $this->markTestSkipped('In sqlite alter columns operations are unsupported - http://www.sqlite.org/omitted.html');
    }

    public function test_add_index()
    {
        //create it
        $table = $this->adapter->create_table('users');
        $table->column('name', 'string', array('limit' => 20));
        $table->column('title', 'string', array('limit' => 20));
        $table->column('age', 'integer');
        $table->finish();

        $this->adapter->add_index("users", "name");

        $this->assertEquals(true, $this->adapter->has_index("users", "name"));
        $this->assertEquals(false, $this->adapter->has_index("users", "age"));

        $this->adapter->add_index("users", "age", array('unique' => true));
        $this->assertEquals(true, $this->adapter->has_index("users", "age"));

        $this->adapter->add_index("users", "title", array('name' => 'index_on_super_title'));
        $this->assertEquals(true, $this->adapter->has_index("users", "title", array('name' => 'index_on_super_title')));
        $this->adapter->remove_index("users", array("name", "age"), array('name' => 'index_on_super_title'));
        $this->assertEquals(false, $this->adapter->has_index("users", "title", array('name' => 'index_on_super_title')));

        $this->drop_table('users');
    }

    public function test_multi_column_index()
    {
        //create it
        $table = $this->adapter->create_table('users');
        $table->column('name', 'string', array('limit' => 20));
        $table->column('age', 'integer');
        $table->finish();
        $this->adapter->add_index("users", array("name", "age"));

        $this->assertEquals(true, $this->adapter->has_index("users", array("name", "age")));

        //drop it
        $this->adapter->remove_index("users", array("name", "age"));
        $this->assertEquals(false, $this->adapter->has_index("users", array("name", "age")));
        $this->drop_table('users');
    }

    public function test_remove_index_with_default_index_name()
    {
        $table = $this->adapter->create_table('users');
        $table->column('name', 'string', array('limit' => 20));
        $table->column('age', 'integer');
        $table->finish();

        //$this->adapter->execute_ddl("CREATE TABLE users ( name varchar(20), age int(3) );");
        $this->adapter->add_index("users", "name");

        $this->assertEquals(true, $this->adapter->has_index("users", "name"));

        //drop it
        $this->adapter->remove_index("users", "name");
        $this->assertEquals(false, $this->adapter->has_index("users", "name"));
        $this->drop_table('users');
    }

    public function test_remove_index_with_custom_index_name()
    {
        //create it
        $table = $this->adapter->create_table('users');
        $table->column('name', 'string', array('limit' => 20));
        $table->column('age', 'integer');
        $table->finish();

        $this->adapter->add_index("users", "name", array('name' => 'my_special_index'));

        $this->assertTrue($this->adapter->has_index("users", "name", array('name' => 'my_special_index')));

        //drop it
        $this->adapter->remove_index("users", "name", array('name' => 'my_special_index'));
        $this->assertFalse($this->adapter->has_index("users", "name", array('name' => 'my_special_index')));
        $this->drop_table('users');
    }

    public function test_select_all_and_returning()
    {
        $table = $this->adapter->create_table('users');
        $table->column('name', 'string', array('limit' => 20));
        $table->column('age', 'integer');
        $table->finish();

        $id1 = $this->adapter->query(sprintf("INSERT INTO users (name, age) VALUES ('%s', %d)", 'Taco', 32));
        $this->assertEquals(1, $id1);
        $id2 = $this->adapter->query(sprintf("INSERT INTO users (name, age) VALUES ('%s', %d)", 'Bumblebee', 76));
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
}
