<?php

/*
CREATE TABLE `directus_tables` (
  `table_name` varchar(64) NOT NULL DEFAULT '',
  `hidden` tinyint(1) NOT NULL DEFAULT '0',
  `single` tinyint(1) NOT NULL DEFAULT '0',
  `default_status` tinyint(1) NOT NULL DEFAULT '1',
  `is_junction_table` tinyint(1) NOT NULL DEFAULT '0',
  `footer` tinyint(1) DEFAULT '0',
  `list_view` varchar(200) DEFAULT NULL,
  `column_groupings` varchar(255) DEFAULT NULL,
  `primary_column` varchar(255) DEFAULT NULL,
  `user_create_column` varchar(64) DEFAULT NULL,
  `user_update_column` varchar(64) DEFAULT NULL,
  `date_create_column` varchar(64) DEFAULT NULL,
  `date_update_column` varchar(64) DEFAULT NULL,
  `filter_column_blacklist` text,
  PRIMARY KEY (`table_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
*/

use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class CreateDirectusTablesTable extends Ruckusing_Migration_Base
{
    public function up()
    {
      $t = $this->create_table("directus_tables", array(
          "id"=>false,
          "options"=>"ENGINE=InnoDB DEFAULT CHARSET=utf8"
        )
      );

      //columns
      $t->column("table_name", "string", array(
          "limit"=>64,
          "null"=>false,
          "default"=>"",
          "primary_key"=>true
        )
      );
      $t->column("hidden", "tinyinteger", array(
          "limit"=>1,
          "null"=>false,
          "default"=>0
        )
      );
      $t->column("single", "tinyinteger", array(
          "limit"=>1,
          "null"=>false,
          "default"=>0
        )
      );
      $t->column("default_status", "tinyinteger", array(
          "limit"=>1,
          "null"=>false,
          "default"=>1
        )
      );
      $t->column("is_junction_table", "tinyinteger", array(
          "limit"=>1,
          "null"=>false,
          "default"=>0
        )
      );
      $t->column("footer", "tinyinteger", array(
          "limit"=>1,
          "default"=>0
        )
      );
      $t->column("list_view", "string", array(
          "limit"=>200,
          "default"=>NULL
        )
      );
      $t->column("column_groupings", "string", array(
          "limit"=>255,
          "default"=>NULL
        )
      );
      $t->column("primary_column", "string", array(
          "limit"=>255,
          "default"=>NULL
        )
      );
      $t->column("user_create_column", "string", array(
          "limit"=>64,
          "default"=>NULL
        )
      );
      $t->column("user_update_column", "string", array(
          "limit"=>64,
          "default"=>NULL
        )
      );
      $t->column("date_create_column", "string", array(
          "limit"=>64,
          "default"=>NULL
        )
      );
      $t->column("date_update_column", "string", array(
          "limit"=>64,
          "default"=>NULL
        )
      );
      $t->column("filter_column_blacklist", "text");

      $t->finish();

      $this->execute("INSERT INTO `directus_tables` (`table_name`, `hidden`, `single`, `is_junction_table`, `footer`, `list_view`, `column_groupings`, `primary_column`, `user_create_column`, `user_update_column`, `date_create_column`, `date_update_column`)
VALUES
  ('directus_messages_recipients', 1, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  ('directus_bookmarks',1,0,0,0,NULL,NULL,NULL,'user',NULL,NULL,NULL),
  ('directus_files',1,0,0,0,NULL,NULL,NULL,'user',NULL,NULL,NULL),
  ('directus_preferences',1,0,0,0,NULL,NULL,NULL,'user',NULL,NULL,NULL),
  ('directus_users', 1, 0, 0, 0, NULL, NULL, NULL, 'id', NULL, NULL, NULL);");
    }//up()

    public function down()
    {
      $this->drop_table("directus_tables");
    }//down()
}
