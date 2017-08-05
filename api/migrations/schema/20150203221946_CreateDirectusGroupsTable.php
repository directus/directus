<?php
/*
CREATE TABLE `directus_groups` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `description` varchar(500) DEFAULT NULL,
  `restrict_to_ip_whitelist` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
*/
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class CreateDirectusGroupsTable extends Ruckusing_Migration_Base
{
    public function up()
    {
        $t = $this->create_table('directus_groups', [
            'id' => false,
        ]);

        // columns
        $t->column('id', 'integer', [
            'unsigned' => true,
            'null' => false,
            'auto_increment' => true,
            'primary_key' => true
        ]);
        $t->column('name', 'string', [
            'limit' => 100,
            'default' => NULL
        ]);
        $t->column('description', 'string', [
            'limit' => 500,
            'default' => NULL
        ]);
        $t->column('restrict_to_ip_whitelist', 'text', [
            'null' => true,
            'default' => null,
        ]);
        $t->column('nav_override', 'text');
        $t->finish();

        $this->add_index('directus_groups', 'name', [
            'unique' => true,
            'name' => 'directus_users_name_unique'
        ]);

        $this->insert('directus_groups', [
            'id' => 1,
            'name' => 'Administrator',
            'description' => 'Admins have access to all managed data within the system by default'
        ]);

        $this->insert('directus_groups', [
            'id' => 2,
            'name' => 'Public',
            'description' => 'This sets the data that is publicly available through the API without a token'
        ]);
    }//up()

    public function down()
    {
        $this->drop_table('directus_groups');
    }//down()
}
