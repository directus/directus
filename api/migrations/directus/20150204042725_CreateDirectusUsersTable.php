<?php

/*
CREATE TABLE `directus_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `active` tinyint(1) DEFAULT '1',
  `first_name` varchar(50) DEFAULT '',
  `last_name` varchar(50) DEFAULT '',
  `email` varchar(255) DEFAULT '',
  `password` varchar(255) DEFAULT '',
  `salt` varchar(255) DEFAULT '',
  `token` varchar(255) DEFAULT '',
  `reset_token` varchar(255) DEFAULT '',
  `reset_expiration` datetime DEFAULT NULL,
  `position` varchar(500) DEFAULT '',
  `email_messages` tinyint(1) DEFAULT '1',
  `last_login` datetime DEFAULT NULL,
  `last_access` datetime DEFAULT NULL,
  `last_page` varchar(255) DEFAULT '',
  `ip` varchar(50) DEFAULT '',
  `group` int(11) DEFAULT NULL,
  `avatar` varchar(500) DEFAULT NULL,
  `avatar_file_id` int(11) DEFAULT NULL,
  `avatar_is_file` tinyint(1) DEFAULT 0,
  `location` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `state` varchar(2) DEFAULT NULL,
  `zip` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
*/

use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class CreateDirectusUsersTable extends Ruckusing_Migration_Base
{
    public function up()
    {
      $t = $this->create_table("directus_users", array(
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
      $t->column("active", "tinyinteger", array(
          "limit"=>1,
          "default"=>1
        )
      );
      $t->column("first_name", "string", array(
          "limit"=>50,
          "default"=>""
        )
      );
      $t->column("last_name", "string", array(
          "limit"=>50,
          "default"=>""
        )
      );
      $t->column("email", "string", array(
          "limit"=>255,
          "default"=>""
        )
      );
      $t->column("password", "string", array(
          "limit"=>255,
          "default"=>""
        )
      );
      $t->column("salt", "string", array(
          "limit"=>255,
          "default"=>""
        )
      );
      $t->column("token", "string", array(
          "limit"=>255,
          "null"=>false
        )
      );
      $t->column("access_token", "string", array(
          "limit"=>255,
          "default"=>""
        )
      );
      $t->column("reset_token", "string", array(
          "limit"=>255,
          "default"=>""
        )
      );
      $t->column("reset_expiration", "datetime", array(
          "default"=>NULL
        )
      );
      $t->column("position", "string", array(
          "limit"=>500,
          "default"=>""
        )
      );
      $t->column("email_messages", "tinyinteger", array(
          "limit"=>1,
          "default"=>1
        )
      );
      $t->column("last_login", "datetime", array(
          "default"=>NULL
        )
      );
      $t->column("last_access", "datetime", array(
          "default"=>NULL
        )
      );
      $t->column("last_page", "string", array(
          "limit"=>255,
          "default"=>""
        )
      );
      $t->column("ip", "string", array(
          "limit"=>50,
          "default"=>""
        )
      );
      $t->column("group", "integer", array(
          "unsigned"=>true,
          "default"=>NULL
        )
      );
      $t->column("avatar", "string", array(
          "limit"=>500,
          "default"=>NULL
        )
      );
      $t->column("avatar_file_id", "integer", array(
          "unsigned"=>true,
          "default"=>NULL
        )
      );
      $t->column("avatar_is_file", "tinyinteger", array(
          "limit"=>1,
          "default"=>0
        )
      );
      $t->column("location", "string", array(
          "limit"=>255,
          "default"=>NULL
        )
      );
      $t->column("phone", "string", array(
          "limit"=>255,
          "default"=>NULL
        )
      );
      $t->column("address", "string", array(
          "limit"=>255,
          "default"=>NULL
        )
      );
      $t->column("city", "string", array(
          "limit"=>255,
          "default"=>NULL
        )
      );
      $t->column("state", "string", array(
          "limit"=>2,
          "default"=>NULL
        )
      );
      $t->column("zip", "string", array(
          "limit"=>10,
          "default"=>NULL
        )
      );

      $t->column("language", "string", array(
          "limit"=>8,
          "default"=>'en'
        )
      );

      $t->finish();

      $this->add_index("directus_users", "email", array(
        "unique"=>true,
        "name"=>"directus_users_email_unique"
        )
      );

      $this->add_index("directus_users", "token", array(
        "unique"=>true,
        "name"=>"directus_users_token_unique"
        )
      );
    }//up()

    public function down()
    {
      $this->drop_table("directus_users");
    }//down()
}
