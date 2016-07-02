<?php

/*
CREATE TABLE `directus_privileges` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `table_name` varchar(255) CHARACTER SET latin1 NOT NULL,
  `permissions` varchar(500) CHARACTER SET latin1 DEFAULT NULL COMMENT 'Table-level permissions (insert, delete, etc.)',
  `group_id` int(11) NOT NULL,
  `read_field_blacklist` varchar(1000) CHARACTER SET latin1 DEFAULT NULL,
  `write_field_blacklist` varchar(1000) CHARACTER SET latin1 DEFAULT NULL,
  `unlisted` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
*/

use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class CreateDirectusPrivilegesTable extends Ruckusing_Migration_Base
{
    public function up()
    {
      $t = $this->create_table("directus_privileges", array(
        "id"=>false,
        "options"=>""
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
      $t->column("table_name", "string", array(
          "limit"=>255,
          "null"=>false,
          "character"=>"latin1"
        )
      );
      $t->column("group_id", "integer", array(
          "limit"=>11,
          "null"=>false
        )
      );
      $t->column("read_field_blacklist", "string", array(
          "limit"=>1000,
          "default"=>NULL,
          "character"=>"latin1",
        )
      );
      $t->column("write_field_blacklist", "string", array(
          "limit"=>1000,
          "default"=>NULL,
          "character"=>"latin1",
        )
      );
      $t->column("listed", "tinyinteger", array(
          "limit"=>1,
          "default"=>NULL
        )
      );
      $t->column("status_id", "tinyinteger", array(
          "limit"=>1,
          "default"=>0,
          "null"=>false
        )
      );

      $t->finish();

        $this->add_column('directus_privileges', 'allow_view', 'tinyinteger', array(
            'limit' => 1,
            'null' => false,
            'default' => 1
        ));
        $this->add_column('directus_privileges', 'allow_add', 'tinyinteger', array(
            'limit' => 1,
            'null' => false,
            'default' => 1
        ));
        $this->add_column('directus_privileges', 'allow_edit', 'tinyinteger', array(
            'limit' => 1,
            'null' => false,
            'default' => 1
        ));
        $this->add_column('directus_privileges', 'allow_delete', 'tinyinteger', array(
            'limit' => 1,
            'null' => false,
            'default' => 1
        ));
        $this->add_column('directus_privileges', 'allow_alter', 'tinyinteger', array(
            'limit' => 1,
            'null' => false,
            'default' => 1
        ));

      $tables = [
          'directus_activity',
          'directus_columns',
          'directus_groups',
          'directus_files',
          'directus_messages',
          'directus_preferences',
          'directus_privileges',
          'directus_settings',
          'directus_tables',
          'directus_ui',
          'directus_users',
          'directus_social_feeds',
          'directus_messages_recipients',
          'directus_social_posts',
          'directus_tab_privileges',
          'directus_bookmarks'
      ];

      foreach($tables as $table) {
          $this->insert('directus_privileges', [
              'table_name' => $table,
              'allow_view' => 2,
              'allow_add' => 1,
              'allow_edit' => 2,
              'allow_delete' => 2,
              'allow_alter' => 1,
              'group_id' => 1,
              'read_field_blacklist' => NULL,
              'write_field_blacklist' => NULL,
              'listed' => NULL
          ]);
      }

      /*$this->execute("INSERT INTO `directus_privileges` (`id`, `table_name`, `permissions`, `group_id`, `read_field_blacklist`, `write_field_blacklist`, `unlisted`)
VALUES
  (1,'directus_activity','add,edit,bigedit,delete,bigdelete,alter,view,bigview',1,NULL,NULL,NULL),
  (2,'directus_columns','add,edit,bigedit,delete,bigdelete,alter,view,bigview',1,NULL,NULL,NULL),
  (3,'directus_groups','add,edit,bigedit,delete,bigdelete,alter,view,bigview',1,NULL,NULL,NULL),
  (4,'directus_files','add,edit,bigedit,delete,bigdelete,alter,view,bigview',1,NULL,NULL,NULL),
  (5,'directus_messages','add,edit,bigedit,delete,bigdelete,alter,view,bigview',1,NULL,NULL,NULL),
  (6,'directus_preferences','add,edit,bigedit,delete,bigdelete,alter,view,bigview',1,NULL,NULL,NULL),
  (7,'directus_privileges','add,edit,bigedit,delete,bigdelete,alter,view,bigview',1,NULL,NULL,NULL),
  (8,'directus_settings','add,edit,bigedit,delete,bigdelete,alter,view,bigview',1,NULL,NULL,NULL),
  (9,'directus_tables','add,edit,bigedit,delete,bigdelete,alter,view,bigview',1,NULL,NULL,NULL),
  (10,'directus_ui','add,edit,bigedit,delete,bigdelete,alter,view,bigview',1,NULL,NULL,NULL),
  (11,'directus_users','add,edit,bigedit,delete,bigdelete,alter,view,bigview',1,NULL,NULL,NULL),
  (12,'directus_social_feeds','add,edit,bigedit,delete,bigdelete,alter,view,bigview',1,NULL,NULL,NULL),
  (13,'directus_messages_recipients','add,edit,bigedit,delete,bigdelete,alter,view,bigview',1,NULL,NULL,NULL),
  (14,'directus_social_posts','add,edit,bigedit,delete,bigdelete,alter,view,bigview',1,NULL,NULL,NULL),
  (15,'directus_tab_privileges','add,edit,bigedit,delete,bigdelete,alter,view,bigview',1,NULL,NULL,NULL),
  (16,'directus_bookmarks','add,edit,bigedit,delete,bigdelete,alter,view,bigview',1,NULL,NULL,NULL);");*/
    }//up()

    public function down()
    {
      $this->drop_table("directus_privileges");
    }//down()
}
