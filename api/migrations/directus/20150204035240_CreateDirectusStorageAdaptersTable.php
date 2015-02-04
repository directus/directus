<?php

/*
CREATE TABLE `directus_storage_adapters` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `key` varchar(255) CHARACTER SET latin1 NOT NULL,
  `adapter_name` varchar(255) CHARACTER SET latin1 NOT NULL DEFAULT '',
  `role` varchar(255) CHARACTER SET latin1 DEFAULT NULL COMMENT 'DEFAULT, THUMBNAIL, or Null. DEFAULT and THUMBNAIL should only occur once each.',
  `public` tinyint(1) unsigned NOT NULL DEFAULT '1' COMMENT '1 for yes, 0 for no.',
  `destination` varchar(255) CHARACTER SET latin1 NOT NULL DEFAULT '',
  `url` varchar(2000) CHARACTER SET latin1 DEFAULT '' COMMENT 'Trailing slash required.',
  `params` varchar(2000) CHARACTER SET latin1 DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
*/

class CreateDirectusStorageAdaptersTable extends Ruckusing_Migration_Base
{
    public function up()
    {
      $t = $this->create_table("directus_storage_adapters", array(
          "id"=>false,
          "options"=>"ENGINE=InnoDB DEFAULT CHARSET=utf8"
        )
      );

      //columns
      $t->column("id", "integer", array(
          "limit"=>11,
          "unsigned"=>true,
          "null"=>false,
          "AUTO_INCREMENT"=>true,
          "primary_key"=>true
        )
      );
      $t->column("key", "string", array(
          "limit"=>255,
          "CHARACTER"=>"latin1",
          "null"=>false
        )
      );
      $t->column("adapter_name", "string", array(
          "limit"=>255,
          "CHARACTER"=>"latin1",
          "null"=>false,
          "DEFAULT"=>""
        )
      );
      $t->column("role", "string", array(
          "limit"=>255,
          "CHARACTER"=>"latin1",
          "DEFAULT"=>NULL,
          "COMMENT"=>"DEFAULT, THUMBNAIL, or Null. DEFAULT and THUMBNAIL should only occur once each."
        )
      );
      $t->column("public", "tinyinteger", array(
          "limit"=>1,
          "unsigned"=>true,
          "null"=>false,
          "DEFAULT"=>1,
          "COMMENT"=>"1 for yes, 0 for no."
        )
      );
      $t->column("destination", "string", array(
          "limit"=>255,
          "CHARACTER"=>"latin1",
          "null"=>false,
          "DEFAULT"=>""
        )
      );
      $t->column("url", "string", array(
          "limit"=>2000,
          "CHARACTER"=>"latin1",
          "DEFAULT"=>"",
          "COMMENT"=>"Trailing slash required."
        )
      );
      $t->column("params", "string", array(
          "limit"=>2000,
          "CHARACTER"=>"latin1",
          "DEFAULT"=>NULL
        )
      );

      $t->finish();
    }//up()

    public function down()
    {
      $this->drop_table("directus_storage_adapters");
    }//down()
}
