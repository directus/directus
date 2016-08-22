<?php
/*
CREATE TABLE `directus_groups` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `description` varchar(500) DEFAULT NULL,
  `restrict_to_ip_whitelist` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
*/
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class CreateDirectusGroupsTable extends Ruckusing_Migration_Base
{
    public function up()
    {
      $t = $this->create_table("directus_groups", array(
        "id"=>false,
        )
      );

      // columns
      $t->column("id", "integer", array(
          "unsigned"=>true,
          "null"=>false,
          "auto_increment"=>true,
          "primary_key"=>true
        )
      );
      $t->column("name", "string", array(
        "limit" => 100,
        "default"=>NULL
        )
      );
      $t->column("description", "string", array(
        "limit" => 500,
        "default"=>NULL
        )
      );
      $t->column("restrict_to_ip_whitelist", "text", array(
        "null" => true,
        )
      );
      $t->finish();

      $this->insert('directus_groups', [
          'id' => 1,
          'name' => 'Administrator',
          'description' => NULL,
          'restrict_to_ip_whitelist' => 0
      ]);
    }//up()

    public function down()
    {
      $this->drop_table("directus_groups");
    }//down()
}
