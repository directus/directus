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
        $t = $this->create_table('directus_settings', [
            'id' => false,
        ]);

        //columns
        $t->column('id', 'integer', [
            'unsigned' => true,
            'null' => false,
            'auto_increment' => true,
            'primary_key' => true
        ]);
        $t->column('collection', 'string', [
            'limit' => 64,
            'default' => NULL
        ]);
        $t->column('name', 'string', [
            'limit' => 64,
            'default' => NULL
        ]);
        $t->column('value', 'string', [
            'limit' => 255,
            'default' => NULL
        ]);

        $t->finish();

        $this->add_index('directus_settings', ['collection', 'name'], [
            'unique' => true,
            'name' => 'Unique Collection and Name'
        ]);
    }//up()

    public function down()
    {
        $this->remove_index('directus_settings', ['collection', 'name'], [
            'unique' => true,
            'name' => 'Unique Collection and Name'
        ]);
        $this->drop_table('directus_settings');
    }//down()
}
