<?php

/*
CREATE TABLE `directus_messages` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `from` int(11) DEFAULT NULL,
  `subject` varchar(255) NOT NULL DEFAULT '',
  `message` text NOT NULL,
  `datetime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `attachment` int(11) DEFAULT NULL,
  `response_to` int(11) DEFAULT NULL,
  `comment_metadata` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
*/

class CreateDirectusMessagesTable extends Ruckusing_Migration_Base
{
    public function up()
    {
      $t = $this->create_table("directus_messages", array(
          "id"=>false,
          "options"=>"ENGINE=MyISAM DEFAULT CHARSET=utf8"
        )
      );

      //columns
      $t->column("id", "integer", array(
          "limit"=>10,
          "null"=>false,
          "AUTO_INCREMENT"=>true,
          "primary_key"=>true
        )
      );

      $t->column("from", "integer", array(
          "limit"=>11,
          "DEFAULT"=>NULL
        )
      );
      $t->column("subject", "string", array(
          "limit"=>255,
          "null"=>false,
          "DEFAULT"=>""
        )
      );
      $t->column("message", "text", array(
          "null"=>false
        )
      );
      $t->column("datetime", "datetime", array(
          "null"=>false,
          "DEFAULT"=>"0000-00-00 00:00:00"
        )
      );
      $t->column("attachment", "integer", array(
          "limit"=>11,
          "DEFAULT"=>NULL
        )
      );
      $t->column("response_to", "integer", array(
          "limit"=>11,
          "DEFAULT"=>NULL
        )
      );
      $t->column("comment_metadata", "string", array(
          "limit"=>255,
          "DEFAULT"=>NULL
        )
      );

      $t->finish();
    }//up()

    public function down()
    {
      $this->drop_table("directus_messages");
    }//down()
}
