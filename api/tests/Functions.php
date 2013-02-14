<?php
require dirname(__FILE__) . '/../core/functions.php';


class FunctionsTest extends PHPUnit_Framework_TestCase
{
    public function setUp()
    {
    }

    public function testToNameValue()
    {
        $data = array(
           "media_folder" => "resources",
           "media_naming" => "unique",
           "allowed_thumbnails" => "test test test",
           "zxczxczxc" => "zxczxc",
           "thumbnail_quality" => "90",
        );

        $keys = array(
            "collection" => "media"
        );

        $array = to_name_value($data, $keys);

        $this->assertEquals(sizeof($data), sizeof($array));
    }

    public function testPick() {
        $collection = json_decode('[ { "id":"id", "column_name":"id", "type":"INT", "is_nullable":"NO", "comment":"", "sort":1, "ui":"numeric", "system":true, "master":false, "hidden_list":false, "hidden_input":false, "required":false, "hidden":true }, { "id":"room_id", "column_name":"room_id", "type":"INT", "is_nullable":"NO", "comment":"", "sort":2, "ui":"many_to_one", "system":false, "master":false, "hidden_list":false, "hidden_input":false, "required":false, "options":{ "id":"many_to_one", "related_table":"rooms", "visible_column":"title" } }, { "id":"instructor_id", "column_name":"instructor_id", "type":"INT", "is_nullable":"NO", "comment":"", "sort":3, "ui":"many_to_one", "system":false, "master":false, "hidden_list":false, "hidden_input":false, "required":false, "options":{ "id":"many_to_one", "related_table":"instructors", "visible_column":"nickname" } }, { "id":"class_type_id", "column_name":"class_type_id", "type":"INT", "is_nullable":"NO", "comment":"", "sort":4, "ui":"many_to_one", "system":false, "master":false, "hidden_list":false, "hidden_input":false, "required":false, "options":{ "id":"many_to_one", "related_table":"class_types", "visible_column":"title" } }, { "id":"datetime", "column_name":"datetime", "type":"DATETIME", "is_nullable":"NO", "comment":"", "sort":5, "ui":"datetime", "system":false, "master":false, "hidden_list":false, "hidden_input":false, "required":false }, { "id":"note", "column_name":"note", "type":"TEXT", "char_length":"65535", "is_nullable":"NO", "comment":"", "sort":6, "ui":"textarea", "system":false, "master":true, "hidden_list":false, "hidden_input":false, "required":false }, { "id":"users", "column_name":"users", "type":"MANYTOMANY", "is_nullable":"NO", "comment":"", "sort":9999, "ui":"relational", "system":false, "master":false, "hidden_list":false, "hidden_input":false, "table_related":"users", "junction_table":"bookmarks", "junction_key_left":"class_id", "junction_key_right":"user_id", "required":false, "options":{ "id":"relational", "visible_columns":"first_name" } }, { "id":"waitlist", "column_name":"waitlist", "type":"ONETOMANY", "is_nullable":"NO", "comment":"", "sort":9999, "ui":"relational", "system":false, "master":false, "hidden_list":false, "hidden_input":false, "table_related":"waitlist", "junction_key_right":"class_id", "required":false, "options":{ "id":"relational", "visible_columns":"user_id" } } ]', true);
        $data = find($collection, 'master', 1);

        //print_r($data);

    }

}
?>