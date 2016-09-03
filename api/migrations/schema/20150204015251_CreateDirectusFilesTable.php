<?php

/*
CREATE TABLE `directus_files` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `active` tinyint(1) DEFAULT '1',
  `name` varchar(255) DEFAULT NULL,
  `url` varchar(2000) DEFAULT NULL,
  `title` varchar(255) DEFAULT '',
  `location` varchar(200) DEFAULT NULL,
  `caption` text,
  `type` varchar(50) DEFAULT '',
  `charset` varchar(50) DEFAULT '',
  `tags` varchar(255) DEFAULT '',
  `width` int(5) DEFAULT '0',
  `height` int(5) DEFAULT '0',
  `size` int(20) DEFAULT '0',
  `embed_id` varchar(200) DEFAULT NULL,
  `user` int(11) NOT NULL,
  `date_uploaded` datetime DEFAULT NULL,
  `storage_adapter` int(11) unsigned DEFAULT NULL COMMENT 'FK `directus_storage_adapters`.`id`',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Directus Files Storage';
*/

use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class CreateDirectusFilesTable extends Ruckusing_Migration_Base
{
    public function up()
    {
        $t = $this->create_table("directus_files", array(
                "id" => false,
                //"options"=>"COMMENT='Directus Files Storage'"
            )
        );

        //columns
        $t->column("id", "integer", array(
                "unsigned" => true,
                "null" => false,
                "auto_increment" => true,
                "primary_key" => true
            )
        );
        $t->column("active", "tinyinteger", array(
                "limit" => 1,
                "default" => 1
            )
        );
        $t->column("name", "string", array(
                "limit" => 255,
                "default" => NULL
            )
        );
        $t->column("title", "string", array(
                "limit" => 255,
                "default" => ""
            )
        );
        $t->column("location", "string", array(
                "limit" => 200,
                "default" => NULL
            )
        );
        $t->column("caption", "text");
        $t->column("type", "string", array(
                "limit" => 50,
                "default" => ""
            )
        );
        $t->column("charset", "string", array(
                "limit" => 50,
                "default" => ""
            )
        );
        $t->column("tags", "string", array(
                "limit" => 255,
                "default" => ""
            )
        );
        $t->column("width", "integer", array(
                "unsigned" => true,
                "default" => 0
            )
        );
        $t->column("height", "integer", array(
                "unsigned" => true,
                "default" => 0
            )
        );
        $t->column("size", "integer", array(
                "unsigned" => true,
                "default" => 0
            )
        );
        $t->column("embed_id", "string", array(
                "limit" => 200,
                "default" => NULL
            )
        );
        $t->column("user", "integer", array(
                "unsigned" => true,
                "null" => false
            )
        );
        $t->column("date_uploaded", "datetime", array(
                "default" => NULL
            )
        );
        $t->column("storage_adapter", "string", array(
                "limit" => 50,
                "default" => NULL
            )
        );

        $t->finish();
    }//up()

    public function down()
    {
        $this->drop_table("directus_files");
    }//down()
}
