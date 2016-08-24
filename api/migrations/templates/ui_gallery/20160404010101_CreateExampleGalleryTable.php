<?php
/*
CREATE TABLE `example_gallery` (
        `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
        `active` tinyint(4) DEFAULT NULL,
        `wysiwyg` text,
        `checkbox` tinyint(4) DEFAULT NULL,
        `color` varchar(10) DEFAULT NULL,
        `date` date DEFAULT NULL,
        `datetime` datetime DEFAULT NULL,
        `enum` enum('ENTRY 1','ENTRY 2','ENTRY 3') DEFAULT NULL,
        `multiselect` varchar(255) DEFAULT NULL,
        `numeric` int(11) DEFAULT NULL,
        `password` varchar(255) DEFAULT NULL,
        `salt` varchar(255) DEFAULT NULL,
        `radiobuttons` varchar(255) DEFAULT NULL,
        `select` varchar(255) DEFAULT NULL,
        `slider` int(11) DEFAULT NULL,
        `slug` varchar(255) DEFAULT NULL,
        `system` tinyint(4) DEFAULT NULL,
        `tags` varchar(255) DEFAULT NULL,
        `textarea` text,
        `textinput` varchar(255) DEFAULT NULL,
        `time` time DEFAULT NULL,
        `single_file` int(11) DEFAULT NULL,
        `user` int(11) DEFAULT NULL,
        PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=latin1;
*/
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class CreateExampleGalleryTable extends Ruckusing_Migration_Base
{
    public function up()
    {
        $t = $this->create_table('example_gallery', [
                'id' => false,
            ]
        );

        $t->column('id', 'integer', [
                'limit' => 11,
                'unsigned' => true,
                'null' => false,
                'auto_increment' => true,
                'primary_key' => true
            ]
        );

        $t->column('active', 'tinyinteger', [
                'limit' => 4,
                'default' => null
            ]
        );

        $t->column('wysiwyg', 'text');

        $t->column('checkbox', 'tinyinteger', [
            'limit' => 1,
            'default' => null
        ]);

        $t->column('color', 'string', [
            'limit' => 10,
            'default' => null
        ]);

        $t->column('date', 'date', [
            'default' => null
        ]);

        $t->column('datetime', 'datetime', [
            'default' => null
        ]);

        $t->column('enum', 'enum', [
            'values' => ['ENTRY 1','ENTRY 2','ENTRY 3'],
            'default' => null
        ]);

        $t->column('multiselect', 'string', [
            'limit' => 255,
            'default' => null
        ]);

        $t->column('numeric', 'integer', [
            'limit' => 11,
            'default' => null
        ]);

        $t->column('password', 'string', [
            'limit' => 255,
            'default' => null
        ]);

        $t->column('salt', 'string', [
            'limit' => 255,
            'default' => null
        ]);

        $t->column('radiobuttons', 'string', [
            'limit' => 255,
            'default' => null
        ]);

        $t->column('select', 'string', [
            'limit' => 255,
            'default' => null
        ]);

        $t->column('slider', 'integer', [
            'limit' => 11,
            'default' => null
        ]);

        $t->column('slug', 'string', [
            'limit' => 255,
            'default' => null
        ]);

        $t->column('system', 'tinyinteger', [
            'limit' => 4,
            'default' => null
        ]);

        $t->column('tags', 'string', [
            'limit' => 255,
            'default' => null
        ]);

        $t->column('textarea', 'text');

        $t->column('textinput', 'string', [
            'limit' => 255,
            'default' => null
        ]);

        $t->column('time', 'time', [
            'default' => null
        ]);

        $t->column('single_file', 'integer', [
            'limit' => 11,
            'default' => null
        ]);

        $t->column('user', 'integer', [
            'limit' => 11,
            'default' => null
        ]);

        $t->finish();

        $this->insert('example_gallery',[
            'active' => 1,
            'wysiwyg' => '<u>Test</u>',
            'checkbox' => 1,
            'color' => '#27cd2b',
            'date' => '2014-07-10',
            'datetime' => '2014-07-10 11:53:00',
            'enum' => 'ENTRY 2',
            'multiselect' => 'Option 1,Option 2',
            'numeric' => 634,
            'password' => '74d26f2ab730ac48ee8a9c8f494508a542a6273e',
            'salt' => '537d2d1852208',
            'radiobuttons' => 'Option 2',
            'select' => 'Select 2',
            'slider' => 46,
            'slug' => 'test-field',
            'system' => 2,
            'tags' => 'tag1,tag 2,tag 3',
            'textarea' => 'Test Text Area',
            'textinput' => 'test field',
            'time' => '11:58:00',
            'single_file' => NULL,
            'user' => 1
        ]);

        $insert = "INSERT INTO `directus_columns`
        ( `table_name`, `column_name`, `data_type`, `ui`, `system`, `master`, `hidden_input`, `hidden_list`, `required`, `relationship_type`, `table_related`, `junction_table`, `junction_key_left`, `junction_key_right`, `sort`, `comment`)
        VALUES
        ('example_gallery', 'id', NULL, 'numeric', 0, 0, 0, 0, 1, NULL, NULL, NULL, NULL, NULL, 1, ''),
        ('example_gallery', 'active', NULL, 'checkbox', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 2, ''),
        ('example_gallery', 'wysiwyg', NULL, 'wysiwyg', 0, 1, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 3, ''),
        ('example_gallery', 'checkbox', NULL, 'checkbox', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 4, ''),
        ('example_gallery', 'color', NULL, 'color', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 5, ''),
        ('example_gallery', 'date', NULL, 'date', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 6, ''),
        ('example_gallery', 'datetime', NULL, 'datetime', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 7, ''),
        ('example_gallery', 'enum', NULL, 'enum', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 8, ''),
        ('example_gallery', 'many_to_one', NULL, 'many_to_one', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 9, ''),
        ('example_gallery', 'multiselect', NULL, 'multi_select', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 10, ''),
        ('example_gallery', 'numeric', NULL, 'numeric', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 11, ''),
        ('example_gallery', 'password', NULL, 'password', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 12, ''),
        ('example_gallery', 'salt', NULL, 'salt', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 13, ''),
        ('example_gallery', 'radiobuttons', NULL, 'radiobuttons', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 14, ''),
        ('example_gallery', 'select', NULL, 'select', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 15, ''),
        ('example_gallery', 'slider', NULL, 'slider', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 16, ''),
        ('example_gallery', 'slug', NULL, 'slug', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 17, ''),
        ('example_gallery', 'system', NULL, 'system', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 18, ''),
        ('example_gallery', 'tags', NULL, 'tags', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 19, ''),
        ('example_gallery', 'textarea', NULL, 'textarea', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 20, ''),
        ('example_gallery', 'textinput', NULL, 'textinput', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 21, ''),
        ('example_gallery', 'time', NULL, 'time', 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, 22, ''),
        ('example_gallery', 'single_file', 'INT', 'single_file', 0, 0, 0, 0, 0, 'MANYTOONE', 'directus_files', NULL, NULL, 'single_file', 9999, ''),
        ('example_gallery', 'user', 'INT', 'many_to_one', 0, 0, 0, 0, 0, 'MANYTOONE', 'directus_users', NULL, NULL, 'user', 9999, ''),
        ('example_gallery', 'users', 'MANYTOMANY', 'many_to_many', 0, 0, 0, 0, 1, 'MANYTOMANY', 'directus_users', 'example_users', 'ui_id', 'user_id', 9999, ''),
        ('example_gallery', 'files', 'MANYTOMANY', 'multiple_files', 0, 0, 0, 0, 0, 'MANYTOMANY', 'directus_files', 'example_files', 'ui_id', 'file_id', 9999, '');";

        $this->query($insert);

        $tables = ['example_gallery', 'example_users', 'example_files'];
        foreach($tables as $tableName) {
            $this->insert('directus_tables', [
                'table_name' => $tableName,
                'hidden' => $tableName == 'example_gallery' ? 0 : 1,
                'single' => 0,
                'footer' => 0,
                'list_view' => NULL,
                'column_groupings' => NULL,
                'primary_column' => NULL,
                'user_create_column' => NULL,
                'user_update_column' => NULL,
                'date_create_column' => NULL,
                'date_update_column' => NULL,
                'filter_column_blacklist' => NULL
            ]);
            $this->insert('directus_privileges', [
                'table_name' => $tableName,
                'group_id' => 1,
                'read_field_blacklist' => NULL,
                'write_field_blacklist' => NULL,
                'nav_listed' => 1,
                'allow_view' => 2,
                'allow_add' => 1,
                'allow_edit' => 2,
                'allow_delete' => 2,
                'allow_alter' => 1,
                'status_id' => 0
            ]);
        }

        $insert = "INSERT INTO `directus_ui`
        (`table_name`, `column_name`, `ui_name`, `name`, `value`)
        VALUES
        ('example_gallery', 'radiobuttons', 'radiobuttons', 'options', 'Option 1,Option 2,Option 3'),
        ('example_gallery', 'multiselect', 'multi_select', 'type', 'select_list'),
        ('example_gallery', 'multiselect', 'multi_select', 'delimiter', ','),
        ('example_gallery', 'multiselect', 'multi_select', 'options', '{\r\n\"Option 1\":\"option_1\",\r\n\"Option 2\":\"option_2\",\r\n\"Option 3\":\"option_3\"\r\n}'),
        ('example_gallery', 'password', 'password', 'require_confirmation', '1'),
        ('example_gallery', 'password', 'password', 'salt_field', 'salt'),
        ('example_gallery', 'select', 'select', 'options', '{\r\n\"Select 1\":\"select_1\",\r\n\"Select 2\":\"select_2\",\r\n\"Select 3\":\"select_3\"\r\n}'),
        ('example_gallery', 'select', 'select', 'allow_null', '0'),
        ('example_gallery', 'select', 'select', 'placeholder_text', ''),
        ('example_gallery', 'slider', 'slider', 'minimum', '0'),
        ('example_gallery', 'slider', 'slider', 'maximum', '100'),
        ('example_gallery', 'slider', 'slider', 'step', '2'),
        ('example_gallery', 'slug', 'slug', 'readonly', '1'),
        ('example_gallery', 'slug', 'slug', 'size', 'large'),
        ('example_gallery', 'slug', 'slug', 'mirrored_field', 'textinput'),
        ('example_gallery', 'user', 'many_to_one', 'readonly', '0'),
        ('example_gallery', 'user', 'many_to_one', 'visible_status_ids', '1'),
        ('example_gallery', 'user', 'many_to_one', 'visible_column', 'email'),
        ('example_gallery', 'user', 'many_to_one', 'visible_column_template', '{{email}}'),
        ('example_gallery', 'user', 'many_to_one', 'placeholder_text', ''),
        ('example_gallery', 'user', 'many_to_one', 'filter_type', 'dropdown'),
        ('example_gallery', 'user', 'many_to_one', 'filter_column', 'email'),
        ('example_gallery', 'users', 'many_to_many', 'visible_columns', 'email'),
        ('example_gallery', 'users', 'many_to_many', 'add_button', '0'),
        ('example_gallery', 'users', 'many_to_many', 'choose_button', '1'),
        ('example_gallery', 'users', 'many_to_many', 'remove_button', '1'),
        ('example_gallery', 'users', 'many_to_many', 'filter_type', 'dropdown'),
        ('example_gallery', 'users', 'many_to_many', 'filter_column', 'email'),
        ('example_gallery', 'users', 'many_to_many', 'visible_column_template', '{{email}}'),
        ('example_gallery', 'files', 'multiple_files', 'add_button', '0'),
        ('example_gallery', 'files', 'multiple_files', 'choose_button', '1'),
        ('example_gallery', 'files', 'multiple_files', 'remove_button', '1');";

        $this->query($insert);
    }//up()

    public function down()
    {
        $this->drop_table('example_gallery');
    }//down()
}
