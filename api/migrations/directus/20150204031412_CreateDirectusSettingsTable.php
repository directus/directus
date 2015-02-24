<?php

/*
CREATE TABLE `directus_settings` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `collection` varchar(250) DEFAULT NULL,
  `name` varchar(250) DEFAULT NULL,
  `value` varchar(250) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Unique Collection and Name` (`collection`,`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
*/

use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class CreateDirectusSettingsTable extends Ruckusing_Migration_Base
{
    public function up()
    {
      $t = $this->create_table("directus_settings", array(
          "id"=>false,
          "options"=>"ENGINE=InnoDB DEFAULT CHARSET=utf8"
        )
      );

      //columns
      $t->column("id", "integer", array(
          "limit"=>10,
          "unsigned"=>true,
          "null"=>false,
          "auto_increment"=>true,
          "primary_key"=>true
        )
      );
      $t->column("collection", "string", array(
          "limit"=>250,
          "default"=>NULL
        )
      );
      $t->column("name", "string", array(
          "limit"=>250,
          "default"=>NULL
        )
      );
      $t->column("value", "string", array(
          "limit"=>250,
          "default"=>NULL
        )
      );

      $t->finish();

      $this->add_index("directus_settings", array("collection","name"), array(
        "unique"=>true,
        "name"=>"Unique Collection and Name"
        )
      );

      $this->execute("INSERT INTO `directus_settings` (`id`, `collection`, `name`, `value`)
VALUES
  (1,'global','cms_user_auto_sign_out','60'),
  (3,'global','site_name','".$_SESSION['site_name']."'),
  (4,'global','site_url','http://examplesite.dev/'),
  (5,'global','cms_color','#7ac943'),
  (6,'global','rows_per_page','200'),
  (7,'files','storage_adapter','FileSystemAdapter'),
  (8,'files','storage_destination',''),
  (9,'files','thumbnail_storage_adapter','FileSystemAdapter'),
  (10,'files','thumbnail_storage_destination',''),
  (11,'files','thumbnail_quality','100'),
  (12,'files','thumbnail_size','200'),
  (13,'global','cms_thumbnail_url',''),
  (14,'files','file_file_naming','file_id'),
  (15,'files','file_title_naming','file_name'),
  (16,'files','thumbnail_crop_enabled','1');");
    }//up()

    public function down()
    {
      $this->remove_index("directus_settings", array("collection","name"), array(
        "unique"=>true,
        "name"=>"Unique Collection and Name"
        )
      );
      $this->drop_table("directus_settings");
    }//down()
}
