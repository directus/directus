<?php

/*
CREATE TABLE `directus_social_posts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `feed` int(11) NOT NULL COMMENT 'The FK ID of the feed.',
  `datetime` datetime NOT NULL COMMENT 'The date/time this entry was published.',
  `foreign_id` varchar(55) CHARACTER SET latin1 NOT NULL,
  `data` text CHARACTER SET latin1 NOT NULL COMMENT 'The API response for this entry, excluding unnecessary feed metadata, which is stored on the directus_social_feeds table.',
  PRIMARY KEY (`id`),
  UNIQUE KEY `feed` (`feed`,`foreign_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
*/

/*use Ruckusing\Migration\Base as Ruckusing_Migration_Base;
@TODO: Remove this file
class CreateDirectusSocialPostsTable extends Ruckusing_Migration_Base
{
    public function up()
    {
      $t = $this->create_table("directus_social_posts", array(
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
      $t->column("feed", "integer", array(
          "limit"=>11,
          "null"=>false,
          "comment"=>"The FK ID of the feed."
        )
      );
      $t->column("datetime", "datetime", array(
          "null"=>false,
          "comment"=>"The date/time this entry was published."
        )
      );
      $t->column("foreign_id", "string", array(
          "limit"=>55,
          "null"=>false,
          "character"=>"latin1"
        )
      );
      $t->column("data", "text", array(
          "comment"=>"The API response for this entry, excluding unnecessary feed metadata, which is stored on the directus_social_feeds table.",
          "null"=>false,
          "character"=>"latin1"
        )
      );

      $t->finish();
    }//up()

    public function down()
    {
      $this->drop_table("directus_social_posts");
    }//down()
}
*/