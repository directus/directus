<?php

/*
CREATE TABLE `directus_social_feeds` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `type` tinyint(2) NOT NULL COMMENT 'Twitter (1), Instagram (2)',
  `last_checked` datetime DEFAULT NULL,
  `name` varchar(255) CHARACTER SET latin1 NOT NULL,
  `foreign_id` varchar(255) CHARACTER SET latin1 NOT NULL,
  `data` text CHARACTER SET latin1 NOT NULL COMMENT 'Feed metadata. JSON format.',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
*/

/*use Ruckusing\Migration\Base as Ruckusing_Migration_Base;
@TODO: Remove this file
class CreateDirectusSocialFeedsTable extends Ruckusing_Migration_Base
{
    public function up()
    {
      $t = $this->create_table("directus_social_feeds", array(
          "id"=>false,
          "options"=>"ENGINE=InnoDB DEFAULT CHARSET=utf8"
        )
      );

      //columns
      $t->column("id", "integer", array(
          "limit"=>11,
          "null"=>false,
          "auto_increment"=>true,
          "primary_key"=>true
        )
      );
      $t->column("active", "tinyinteger", array(
          "limit"=>1,
          "null"=>false,
          "default"=>1
        )
      );
      $t->column("type", "tinyinteger", array(
          "limit"=>2,
          "null"=>false,
          "comment"=>"Twitter (1), Instagram (2)"
        )
      );
      $t->column("last_checked", "datetime", array(
          "default"=>NULL
        )
      );
      $t->column("name", "string", array(
          "limit"=>255,
          "character"=>"latin1",
          "null"=>false
        )
      );
      $t->column("foreign_id", "string", array(
          "limit"=>255,
          "character"=>"latin1",
          "null"=>false
        )
      );
      $t->column("data", "text", array(
          "character"=>"latin1",
          "null"=>false,
          "comment"=>"Feed metadata. JSON format."
        )
      );

      $t->finish();
    }//up()

    public function down()
    {
      $this->drop("directus_social_feeds");
    }//down()
}
*/