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
        $t = $this->create_table('directus_privileges', [
            'id' => false,
        ]);

        //columns
        $t->column('id', 'integer', [
            'unsigned' => true,
            'null' => false,
            'auto_increment' => true,
            'primary_key' => true
        ]);
        $t->column('table_name', 'string', [
            'limit' => 255,
            'null' => false,
        ]);
        $t->column('allow_view', 'tinyinteger', [
            'limit' => 1,
            'null' => false,
            'default' => 0,
        ]);
        $t->column('allow_add', 'tinyinteger', [
            'limit' => 1,
            'null' => false,
            'default' => 0,
        ]);
        $t->column('allow_edit', 'tinyinteger', [
            'limit' => 1,
            'null' => false,
            'default' => 0,
        ]);
        $t->column('allow_delete', 'tinyinteger', [
            'limit' => 1,
            'null' => false,
            'default' => 0,
        ]);
        $t->column('allow_alter', 'tinyinteger', [
            'limit' => 1,
            'null' => false,
            'default' => 0,
        ]);
        $t->column('group_id', 'integer', [
            'unsigned' => true,
            'null' => false
        ]);
        $t->column('read_field_blacklist', 'string', [
            'limit' => 1000,
            'default' => NULL
        ]);
        $t->column('write_field_blacklist', 'string', [
            'limit' => 1000,
            'default' => NULL,
            'character' => 'latin1',
        ]);
        $t->column('nav_listed', 'tinyinteger', [
            'null' => false,
            'limit' => 1,
            'default' => 1
        ]);
        $t->column('status_id', 'tinyinteger', [
            'limit' => 1,
            'default' => NULL,
            'null' => true
        ]);

        $t->finish();

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
            'directus_users',
            'directus_messages_recipients',
            'directus_bookmarks'
        ];

        foreach ($tables as $table) {
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
                'nav_listed' => 1
            ]);
        }
    }//up()

    public function down()
    {
        $this->drop_table('directus_privileges');
    }//down()
}
