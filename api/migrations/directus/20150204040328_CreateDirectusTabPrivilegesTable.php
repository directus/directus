<?php

/*
CREATE TABLE `directus_tab_privileges` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `group_id` int(11) DEFAULT NULL,
  `tab_blacklist` varchar(500) DEFAULT NULL,
  `nav_override` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
*/

use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class CreateDirectusTabPrivilegesTable extends Ruckusing_Migration_Base
{
    public function up()
    {
      $t = $this->create_table("directus_tab_privileges", array(
          "id"=>false,
        )
      );

      //columns
      $t->column("id", "integer", array(
          "unsigned"=>true,
          "null"=>false,
          "auto_increment"=>true,
          "primary_key"=>true
        )
      );
      $t->column("group_id", "integer", array(
          "unsigned"=>true,
          "default"=>NULL
        )
      );
      $t->column("tab_blacklist", "string", array(
          "limit"=>500,
          "default"=>NULL
        )
      );
      $t->column("nav_override", "text");

      $t->finish();
    }//up()

    public function down()
    {
      $this->drop_table("directus_tab_privileges");
    }//down()
}
