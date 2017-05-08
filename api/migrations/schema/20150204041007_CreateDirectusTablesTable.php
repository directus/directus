<?php

/*
CREATE TABLE `directus_tables` (
  `table_name` varchar(64) NOT NULL DEFAULT '',
  `hidden` tinyint(1) NOT NULL DEFAULT '0',
  `single` tinyint(1) NOT NULL DEFAULT '0',
  `default_status` tinyint(1) NOT NULL DEFAULT '1',
  `footer` tinyint(1) DEFAULT '0',
  `list_view` varchar(200) DEFAULT NULL,
  `column_groupings` varchar(255) DEFAULT NULL,
  `primary_column` varchar(255) DEFAULT NULL,
  `user_create_column` varchar(64) DEFAULT NULL,
  `user_update_column` varchar(64) DEFAULT NULL,
  `date_create_column` varchar(64) DEFAULT NULL,
  `date_update_column` varchar(64) DEFAULT NULL,
  `filter_column_blacklist` text,
  PRIMARY KEY (`table_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
*/

use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class CreateDirectusTablesTable extends Ruckusing_Migration_Base
{
    public function up()
    {
        $t = $this->create_table('directus_tables', [
            'id' => false,
        ]);

        // columns
        $t->column('table_name', 'string', [
            'limit' => 64,
            'null' => false,
            'default' => '',
            'primary_key' => true
        ]);
        $t->column('display_template', 'string', [
            'limit' => 255,
            'null' => true,
            'default' => ''
        ]);
        $t->column('preview_url', 'string', [
            'limit' => 255,
            'null' => true,
            'default' => ''
        ]);
        $t->column('hidden', 'tinyinteger', [
            'limit' => 1,
            'null' => false,
            'default' => 0
        ]);
        $t->column('single', 'tinyinteger', [
            'limit' => 1,
            'null' => false,
            'default' => 0
        ]);
        $t->column('default_status', 'tinyinteger', [
            'limit' => 1,
            'null' => false,
            'default' => 1
        ]);
        $t->column('footer', 'tinyinteger', [
            'limit' => 1,
            'default' => 0
        ]);
        $t->column('column_groupings', 'string', [
            'limit' => 255,
            'default' => NULL
        ]);
        $t->column('primary_column', 'string', [
            'limit' => 64,
            'default' => NULL
        ]);
        $t->column('sort_column', 'string', [
            'limit' => 64,
            'default' => NULL
        ]);
        $t->column('status_column', 'string', [
            'limit' => 64,
            'default' => NULL
        ]);
        $t->column('status_mapping', 'text', [
            'default' => NULL
        ]);
        $t->column('user_create_column', 'string', [
            'limit' => 64,
            'default' => NULL
        ]);
        $t->column('user_update_column', 'string', [
            'limit' => 64,
            'default' => NULL
        ]);
        $t->column('date_create_column', 'string', [
            'limit' => 64,
            'default' => NULL
        ]);
        $t->column('date_update_column', 'string', [
            'limit' => 64,
            'default' => NULL
        ]);
        $t->column('filter_column_blacklist', 'text');

        $t->finish();

        $this->insert('directus_tables', [
            'table_name' => 'directus_messages_recipients',
            'hidden' => 1,
            'single' => 0,
            'footer' => 0,
            'column_groupings' => NULL,
            'primary_column' => NULL,
            'user_create_column' => 'recipient',
            'user_update_column' => NULL,
            'date_create_column' => NULL,
            'date_update_column' => NULL,
        ]);

        $tables = [
            'directus_bookmarks',
            'directus_files',
            'directus_preferences'
        ];
        foreach ($tables as $table) {
            $this->insert('directus_tables', [
                'table_name' => $table,
                'hidden' => 1,
                'single' => 0,
                'footer' => 0,
                'column_groupings' => NULL,
                'primary_column' => NULL,
                'user_create_column' => 'user',
                'user_update_column' => NULL,
                'date_create_column' => NULL,
                'date_update_column' => NULL,
            ]);
        }

        $this->insert('directus_tables', [
            'table_name' => 'directus_users',
            'hidden' => 1,
            'single' => 0,
            'footer' => 0,
            'column_groupings' => NULL,
            'primary_column' => NULL,
            'user_create_column' => 'id',
            'user_update_column' => NULL,
            'date_create_column' => NULL,
            'date_update_column' => NULL,
        ]);
    }//up()

    public function down()
    {
        $this->drop_table('directus_tables');
    }//down()
}
