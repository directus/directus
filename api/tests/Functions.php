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
}
?>