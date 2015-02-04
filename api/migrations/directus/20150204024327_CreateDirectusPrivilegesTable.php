<?php

/*
CREATE TABLE `directus_privileges` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `table_name` varchar(255) CHARACTER SET latin1 NOT NULL,
  `permissions` varchar(500) CHARACTER SET latin1 DEFAULT NULL COMMENT 'Table-level permissions (insert, delete, etc.)',
  `group_id` int(11) NOT NULL,
  `read_field_blacklist` varchar(1000) CHARACTER SET latin1 DEFAULT NULL,
  `write_field_blacklist` varchar(1000) CHARACTER SET latin1 DEFAULT NULL,
  `unlisted` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
*/

class CreateDirectusPrivilegesTable extends Ruckusing_Migration_Base
{
    public function up()
    {
      $t = $this->create_table("directus_privileges", array(
        "id"=>false,
        "options"=>"ENGINE=InnoDB DEFAULT CHARSET=utf8"
        )
      );

      //columns
      $t->column("id", "integer", array(
          "limit"=>11,
          "null"=>false,
          "AUTO_INCREMENT"=>true,
          "primary_key"=>true
        )
      );
      $t->column("table_name", "string", array(
          "limit"=>255,
          "null"=>false,
          "character"=>"latin1"
        )
      );
      $t->column("permissions", "string", array(
          "limit"=>500,
          "DEFAULT"=>NULL,
          "character"=>"latin1",
          "COMMENT"=>"Table-level permissions (insert, delete, etc.)"
        )
      );
      $t->column("group_id", "integer", array(
          "limit"=>11,
          "null"=>false
        )
      );
      $t->column("read_field_blacklist", "string", array(
          "limit"=>1000,
          "DEFAULT"=>NULL,
          "character"=>"latin1",
        )
      );
      $t->column("write_field_blacklist", "string", array(
          "limit"=>1000,
          "DEFAULT"=>NULL,
          "character"=>"latin1",
        )
      );
      $t->column("unlisted", "tinyinteger", array(
          "limit"=>1,
          "DEFAULT"=>NULL
        )
      );

      $t->finish();
    }//up()

    public function down()
    {
      $this->drop_table("directus_privileges");
    }//down()
}
