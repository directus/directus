<?php
require dirname(__FILE__) . '/../config.php';
require dirname(__FILE__) . '/../core/db.php';
require dirname(__FILE__) . '/../core/functions.php';


class DBTest extends PHPUnit_Framework_TestCase
{
    public function setUp()
    {
        $this->db = new DB(DB_USER, DB_PASSWORD, DB_NAME, DB_HOST);
        $this->tables = $this->db->get_tables();

        // Truncate the demo table!
        $this->db->dbh->exec("TRUNCATE TABLE `demo_table`");
    }

    public function testGetTables()
    {
        foreach ($this->tables as $table) {
            $table_name = $table['schema']['table_name'];

            $this->assertNotNull($table['columns']);
            $this->assertNotNull($table['schema']);
            $this->assertNotNull($table['preferences']);

            echo "\n table: $table_name";
            $entries = $this->db->get_entries($table_name);
            $this->assertNotNull($entries);
            $this->assertArrayHasKey('rows', $entries);
            $this->assertArrayHasKey('total', $entries);
        }
    }

    public function testSetEntry()
    {
        // Insert a new item
        $data = array('title' => 'inserted', 'number' => 777);
        $id = $this->db->set_entry('demo_table',$data);

        // Make sure that it's id is LGT 0
        $this->assertNotNull($id);
        $this->assertGreaterThan(0, $id);

        // Get the item
        $data = $this->db->get_entries('demo_table', array('id' => $id));

        $this->assertEquals($data['title'], 'inserted');

        // Change it...
        $data['title'] = 'updated';
        $this->db->set_entry('demo_table', $data);

        // Get it again
        $data = $this->db->get_entries('demo_table', array('id' => $id));

        $this->assertEquals($data['title'], 'updated');

        $this->db->dbh->exec("DELETE FROM `demo_table` WHERE id=$id");

        //Make sure it's gone
        $data = $this->db->get_entries('demo_table', array('id' => $id));
        $this->assertEquals(0,sizeof($data));
    }

    public function testSetEntrie()
    {
        // Insert a bunch of items
        $data = array(
            array('title' => 'playing', 'number' => 1),
            array('title' => 'solitaire', 'number' => 2),
            array('title' => 'by', 'number' => 3),
            array('title' => 'the', 'number' => 4),
            array('title' => 'window', 'number' => 5),
        );

        $this->db->set_entries('demo_table', $data);

        // Get em
        $entries = $this->db->get_entries('demo_table', array('orderBy'=>'id', 'orderDirection'=>'ASC'));

        $this->assertEquals(5, $entries['total']);
        $this->assertArrayHasKey('rows', $entries);

        // Make sure they are all there!
        foreach($entries['rows'] as $i => $row) {
            $this->assertEquals($data[$i]['title'], $row['title']);
        }
    }
}
?>