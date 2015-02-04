<?php

/*
CREATE TABLE `directus_ip_whitelist` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `ip_address` varchar(250) DEFAULT NULL,
  `description` varchar(250) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
*/

class CreateDirectusIpWhitelistTable extends Ruckusing_Migration_Base
{
    public function up()
    {
      $t = $this->create_table("directus_ip_whitelist", array(
        "id"=>false,
        "options"=>array("ENGINE=InnoDB DEFAULT CHARSET=utf8")
        )
      );

      //columns
      $t->column("id", "integer", array(
          "limit"=>10,
          "unsigned"=>true,
          "null"=>false,
          "AUTO_INCREMENT"=>true,
          "primary_key"=>true
        )
      );
      $t->column("ip_address", "string", array(
          "limit"=>250,
          "default"=>NULL
        )
      );
      $t->column("description", "string", array(
          "limit"=>250,
          "default"=>NULL
        )
      );
    }//up()

    public function down()
    {
      $this->drop_table("directus_ip_whitelist");
    }//down()
}
