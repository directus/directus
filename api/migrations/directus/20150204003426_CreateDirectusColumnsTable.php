<?php

/*
CREATE TABLE `directus_columns` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `table_name` varchar(64) NOT NULL DEFAULT '',
  `column_name` varchar(64) NOT NULL DEFAULT '',
  `data_type` varchar(64) DEFAULT NULL,
  `ui` varchar(64) DEFAULT NULL,
  `system` tinyint(1) NOT NULL DEFAULT '0',
  `master` tinyint(1) NOT NULL DEFAULT '0',
  `hidden_input` tinyint(1) NOT NULL DEFAULT '0',
  `hidden_list` tinyint(1) NOT NULL DEFAULT '0',
  `required` tinyint(1) NOT NULL DEFAULT '0',
  `relationship_type` varchar(20) DEFAULT NULL,
  `table_related` varchar(64) DEFAULT NULL,
  `junction_table` varchar(64) DEFAULT NULL,
  `junction_key_left` varchar(64) DEFAULT NULL,
  `junction_key_right` varchar(64) DEFAULT NULL,
  `sort` int(11) DEFAULT NULL,
  `comment` varchar(1024) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `table-column` (`table_name`,`column_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
*/

class CreateDirectusColumnsTable extends Ruckusing_Migration_Base
{
    public function up()
    {
      $t = $this->create_table("directus_columns", array(
        "id"=>false,
        "options"=>"ENGINE=InnoDB DEFAULT CHARSET=utf8"
        )
      );

      //columns
      $t->column("id", "integer", array(
        "unsigned"=>true,
        "AUTO_INCREMENT"=>true,
        "null"=>false,
        "primary_key"=>true
        )
      );
      $t->column("table_name", "string", array(
        "limit"=>64,
        "null"=>false,
        "default"=>""
        )
      );
      $t->column("column_name", "string", array(
        "limit"=>64,
        "null"=>false,
        "default"=>""
        )
      );
      $t->column("data_type", "string", array(
        "limit"=>64,
        "default"=>NULL
        )
      );
      $t->column("ui", "string", array(
        "limit"=>64,
        "default"=>NULL
        )
      );
      $t->column("system", "tinyinteger", array(
          "limit"=>1,
          "null"=>false,
          "default"=>0
        )
      );
      $t->column("master", "tinyinteger", array(
          "limit"=>1,
          "null"=>false,
          "default"=>0
        )
      );
      $t->column("hidden_input", "tinyinteger", array(
          "limit"=>1,
          "null"=>false,
          "default"=>0
        )
      );
      $t->column("hidden_list", "tinyinteger", array(
          "limit"=>1,
          "null"=>false,
          "default"=>0
        )
      );
      $t->column("required", "tinyinteger", array(
          "limit"=>1,
          "null"=>false,
          "default"=>0
        )
      );
      $t->column("relationship_type", "string", array(
          "limit"=>20,
          "default"=>NULL
        )
      );
      $t->column("table_related", "string", array(
          "limit"=>64,
          "default"=>NULL
        )
      );
      $t->column("junction_table", "string", array(
          "limit"=>64,
          "default"=>NULL
        )
      );
      $t->column("junction_key_left", "string", array(
          "limit"=>64,
          "default"=>NULL
        )
      );
      $t->column("junction_key_right", "string", array(
          "limit"=>64,
          "default"=>NULL
        )
      );
      $t->column("sort", "integer", array(
          "limit"=>11,
          "default"=>NULL
        )
      );
      $t->column("comment", "string", array(
          "limit"=>1024,
          "default"=>NULL
        )
      );

      $t->finish();

      $this->add_index("directus_columns", array("table_name","column_name"), array(
        "unique"=>true,
        "name"=>"table-column"
        )
      );
    }//up()

    public function down()
    {
      $this->drop_table("directus_columns");
      $this->remove_index("directus_columns", array("table_name","column_name"), array(
        "unique"=>true,
        "name"=>"table-column"
        )
      );
    }//down()
}
