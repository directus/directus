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

class CreateDirectusUsersTable extends Ruckusing_Migration_Base
{
    public function up()
    {
      $t = $this->create_table("directus_users", array(
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
      $t->column("active", "tinyinteger", array(
          "limit"=>1,
          "DEFAULT"=>1
        )
      );
      $t->column("first_name", "string", array(
          "limit"=>50,
          "DEFAULT"=>""
        )
      );
      $t->column("last_name", "string", array(
          "limit"=>50,
          "DEFAULT"=>""
        )
      );
      $t->column("email", "string", array(
          "limit"=>255,
          "DEFAULT"=>""
        )
      );
      $t->column("password", "string", array(
          "limit"=>255,
          "DEFAULT"=>""
        )
      );
      $t->column("salt", "string", array(
          "limit"=>255,
          "DEFAULT"=>""
        )
      );
      $t->column("token", "string", array(
          "limit"=>255,
          "DEFAULT"=>""
        )
      );
      $t->column("reset_token", "string", array(
          "limit"=>255,
          "DEFAULT"=>""
        )
      );
      $t->column("reset_expiration", "datetime", array(
          "DEFAULT"=>NULL
        )
      );
      $t->column("position", "string", array(
          "limit"=>500,
          "DEFAULT"=>""
        )
      );
      $t->column("email_messages", "tinyinteger", array(
          "limit"=>1,
          "DEFAULT"=>1
        )
      );
      $t->column("last_login", "datetime", array(
          "DEFAULT"=>NULL
        )
      );
      $t->column("last_access", "datetime", array(
          "DEFAULT"=>NULL
        )
      );
      $t->column("last_page", "string", array(
          "limit"=>255,
          "DEFAULT"=>""
        )
      );
      $t->column("ip", "string", array(
          "limit"=>50,
          "DEFAULT"=>""
        )
      );
      $t->column("group", "integer", array(
          "limit"=>11,
          "DEFAULT"=>NULL
        )
      );
      $t->column("avatar", "string", array(
          "limit"=>500,
          "DEFAULT"=>NULL
        )
      );
      $t->column("avatar_file_id", "integer", array(
          "limit"=>11,
          "DEFAULT"=>NULL
        )
      );
      $t->column("avatar_is_file", "tinyinteger", array(
          "limit"=>1,
          "DEFAULT"=>0
        )
      );
      $t->column("location", "string", array(
          "limit"=>255,
          "DEFAULT"=>NULL
        )
      );
      $t->column("phone", "string", array(
          "limit"=>255,
          "DEFAULT"=>NULL
        )
      );
      $t->column("address", "string", array(
          "limit"=>255,
          "DEFAULT"=>NULL
        )
      );
      $t->column("city", "string", array(
          "limit"=>255,
          "DEFAULT"=>NULL
        )
      );
      $t->column("state", "string", array(
          "limit"=>2,
          "DEFAULT"=>NULL
        )
      );
      $t->column("zip", "string", array(
          "limit"=>10,
          "DEFAULT"=>NULL
        )
      );

      $t->finish();
    }//up()

    public function down()
    {
      $this->drop_table("directus_users");
    }//down()
}
