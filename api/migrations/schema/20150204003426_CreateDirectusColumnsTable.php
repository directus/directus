<?php

/*
CREATE TABLE `directus_columns` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `table_name` varchar(64) NOT NULL DEFAULT '',
  `column_name` varchar(64) NOT NULL DEFAULT '',
  `data_type` varchar(64) DEFAULT NULL,
  `ui` varchar(64) DEFAULT NULL,
  `system` tinyint(1) NOT NULL DEFAULT '0',
  `master` tinyint(1) NOT NULL DEFAULT '0',
  `hidden_input` tinyint(1) NOT NULL DEFAULT '0',
  `hidden_list` tinyint(1) NOT NULL DEFAULT '0',
  `required` tinyint(1) NOT NULL DEFAULT '0',
  `relationship_type` varchar(20) DEFAULT NULL,
  `table_related` varchar(64) DEFAULT NULL,
  `junction_table` varchar(64) DEFAULT NULL,
  `junction_key_left` varchar(64) DEFAULT NULL,
  `junction_key_right` varchar(64) DEFAULT NULL,
  `sort` int(11) DEFAULT NULL,
  `comment` varchar(1024) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `table-column` (`table_name`,`column_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
*/

use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class CreateDirectusColumnsTable extends Ruckusing_Migration_Base
{
    public function up()
    {
        $t = $this->create_table('directus_columns', [
            'id' => false,
        ]);

        //columns
        $t->column('id', 'integer', [
            'unsigned' => true,
            'auto_increment' => true,
            'null' => false,
            'primary_key' => true
        ]);
        $t->column('table_name', 'string', [
            'limit' => 64,
            'null' => false,
            'default' => ''
        ]);
        $t->column('column_name', 'string', [
            'limit' => 64,
            'null' => false,
            'default' => ''
        ]);
        $t->column('data_type', 'string', [
            'limit' => 64,
            'default' => NULL
        ]);
        $t->column('ui', 'string', [
            'limit' => 64,
            'default' => NULL
        ]);
        $t->column('relationship_type', 'enum', [
            'values' => ['MANYTOONE', 'MANYTOMANY', 'ONETOMANY'],
            'default' => null
        ]);
        $t->column('related_table', 'string', [
            'limit' => 64,
            'default' => NULL
        ]);
        $t->column('junction_table', 'string', [
            'limit' => 64,
            'default' => NULL
        ]);
        $t->column('junction_key_left', 'string', [
            'limit' => 64,
            'default' => NULL
        ]);
        $t->column('junction_key_right', 'string', [
            'limit' => 64,
            'default' => NULL
        ]);
        $t->column('hidden_input', 'tinyinteger', [
            'limit' => 1,
            'null' => false,
            'default' => 0
        ]);
        $t->column('required', 'tinyinteger', [
            'limit' => 1,
            'null' => false,
            'default' => 0
        ]);
        $t->column('sort', 'integer', [
            'default' => NULL
        ]);
        $t->column('comment', 'string', [
            'limit' => 1024,
            'default' => NULL
        ]);
        $t->column('options', 'text', [
            'null' => true,
            'default' => NULL
        ]);

        $t->finish();

        $this->add_index('directus_columns', ['table_name', 'column_name'], [
            'unique' => true,
            'name' => 'table-column'
        ]);

        $this->insert('directus_columns', [
            'table_name' => 'directus_users',
            'column_name' => 'group',
            'data_type' => NULL,
            'ui' => 'many_to_one',
            'hidden_input' => 0,
            'required' => 0,
            'relationship_type' => 'MANYTOONE',
            'related_table' => 'directus_groups',
            'junction_table' => NULL,
            'junction_key_left' => NULL,
            'junction_key_right' => 'group_id',
            'sort' => NULL,
            'comment' => ''
        ]);

        $this->insert('directus_columns', [
            'table_name' => 'directus_users',
            'column_name' => 'avatar_file_id',
            'data_type' => 'INT',
            'ui' => 'single_file',
            'hidden_input' => 0,
            'required' => 0,
            'relationship_type' => 'MANYTOONE',
            'related_table' => 'directus_files',
            'junction_table' => NULL,
            'junction_key_left' => NULL,
            'junction_key_right' => 'avatar_file_id',
            'sort' => NULL,
            'comment' => ''
        ]);

        $this->insert('directus_columns', [
            'table_name' => 'directus_groups',
            'column_name' => 'users',
            'data_type' => 'ALIAS',
            'ui' => 'directus_users',
            'hidden_input' => 0,
            'required' => 0,
            'relationship_type' => 'ONETOMANY',
            'related_table' => 'directus_users',
            'junction_table' => NULL,
            'junction_key_left' => NULL,
            'junction_key_right' => 'group'
        ]);

        $this->insert('directus_columns', [
            'table_name' => 'directus_groups',
            'column_name' => 'permissions',
            'data_type' => 'ALIAS',
            'ui' => 'directus_permissions',
            'hidden_input' => 0,
            'required' => 0,
            'relationship_type' => 'ONETOMANY',
            'related_table' => 'directus_privileges',
            'junction_table' => NULL,
            'junction_key_left' => NULL,
            'junction_key_right' => 'group_id'
        ]);
    }//up()

    public function down()
    {
        $this->remove_index('directus_columns', ['table_name', 'column_name'], [
            'unique' => true,
            'name' => 'table-column'
        ]);

        $this->drop_table('directus_columns');
    }//down()
}
