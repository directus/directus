<?php
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class AddShowNavColumnsDirectusGroups extends Ruckusing_Migration_Base
{
    public function up()
    {
        $this->add_column('directus_groups', 'show_activity', 'tinyinteger', array(
            'limit' => 1,
            'null' => false,
            'default' => 0
        ));
        $this->add_column('directus_groups', 'show_messages', 'tinyinteger', array(
            'limit' => 1,
            'null' => false,
            'default' => 0
        ));
        $this->add_column('directus_groups', 'show_users', 'tinyinteger', array(
            'limit' => 1,
            'null' => false,
            'default' => 0
        ));
        $this->add_column('directus_groups', 'show_files', 'tinyinteger', array(
            'limit' => 1,
            'null' => false,
            'default' => 0
        ));
    }//up()

    public function down()
    {
        $this->remove_column('directus_groups', 'show_activity');
        $this->remove_column('directus_groups', 'show_messages');
        $this->remove_column('directus_groups', 'show_users');
        $this->remove_column('directus_groups', 'show_files');
    }//down()
}
