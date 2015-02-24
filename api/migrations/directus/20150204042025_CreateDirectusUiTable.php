<?php

/*
CREATE TABLE `directus_ui` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `table_name` varchar(64) DEFAULT NULL,
  `column_name` varchar(64) DEFAULT NULL,
  `ui_name` varchar(200) DEFAULT NULL,
  `name` varchar(200) DEFAULT NULL,
  `value` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique` (`table_name`,`column_name`,`ui_name`,`name`)
  
INSERT INTO `directus_ui` (`table_name`, `column_name`, `ui_name`, `name`, `value`)
VALUES
  ('directus_users','avatar_file_id', 'single_file', 'allowed_filetypes', 'image/');
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
*/

use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class CreateDirectusUiTable extends Ruckusing_Migration_Base
{
    public function up()
    {
      $t = $this->create_table("directus_ui", array(
          "id"=>false,
          "options"=>"ENGINE=InnoDB DEFAULT CHARSET=utf8"
        )
      );

      //columns
      $t->column("id", "integer", array(
          "limit"=>11,
          "unsigned"=>true,
          "null"=>false,
          "auto_increment"=>true,
          "primary_key"=>true
        )
      );
      $t->column("table_name", "string", array(
          "limit"=>64,
          "default"=>NULL
        )
      );
      $t->column("column_name", "string", array(
          "limit"=>64,
          "default"=>NULL
        )
      );
      $t->column("ui_name", "string", array(
          "limit"=>200,
          "default"=>NULL
        )
      );
      $t->column("name", "string", array(
          "limit"=>200,
          "default"=>NULL
        )
      );
      $t->column("value", "text");

      $t->finish();

      $this->add_index("directus_ui", array("table_name","column_name", "ui_name", "name"), array(
        "unique"=>true,
        "name"=>"unique"
        )
      );

      $this->execute("INSERT INTO `directus_ui` (`table_name`, `column_name`, `ui_name`, `name`, `value`)
VALUES
  ('directus_users','avatar_file_id', 'single_file', 'allowed_filetypes', 'image/');");
    }//up()

    public function down()
    {
      $this->remove_index("directus_ui", array("table_name","column_name", "ui_name", "name"), array(
        "unique"=>true,
        "name"=>"unique"
        )
      );
      $this->drop_table("directus_ui");
    }//down()
}
