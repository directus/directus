<?php
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class AddShowNavColumnsDirectusGroups extends Ruckusing_Migration_Base
{
    public function up()
    {
        if (!$this->has_column('directus_groups', 'show_activity')) {
            $this->add_column('directus_groups', 'show_activity', 'tinyinteger', [
                'limit' => 1,
                'null' => false,
                'default' => 1
            ]);
        }

        if (!$this->has_column('directus_groups', 'show_messages')) {
            $this->add_column('directus_groups', 'show_messages', 'tinyinteger', [
                'limit' => 1,
                'null' => false,
                'default' => 1
            ]);
        }

        if (!$this->has_column('directus_groups', 'show_users')) {
            $this->add_column('directus_groups', 'show_users', 'tinyinteger', [
                'limit' => 1,
                'null' => false,
                'default' => 1
            ]);
        }

        if (!$this->has_column('directus_groups', 'show_files')) {
            $this->add_column('directus_groups', 'show_files', 'tinyinteger', [
                'limit' => 1,
                'null' => false,
                'default' => 1
            ]);
        }
    }//up()

    public function down()
    {
        if ($this->has_column('directus_groups', 'show_activity')) {
            $this->remove_column('directus_groups', 'show_activity');
        }

        if ($this->has_column('directus_groups', 'show_messages')) {
            $this->remove_column('directus_groups', 'show_messages');
        }

        if ($this->has_column('directus_groups', 'show_users')) {
            $this->remove_column('directus_groups', 'show_users');
        }

        if ($this->has_column('directus_groups', 'show_files')) {
            $this->remove_column('directus_groups', 'show_files');
        }
    }//down()
}
