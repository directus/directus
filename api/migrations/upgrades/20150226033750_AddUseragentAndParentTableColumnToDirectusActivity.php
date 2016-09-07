<?php
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class AddUseragentAndParentTableColumnToDirectusActivity extends Ruckusing_Migration_Base
{
    public function up()
    {
        if (!$this->has_column('directus_activity', 'user_agent')) {
            $this->add_column('directus_activity', 'user_agent', 'string', ['limit' => 256]);
        }

        if (!$this->has_column('directus_activity', 'parent_table')) {
            $this->add_column('directus_activity', 'parent_table', 'string', ['limit' => 100, 'after' => 'parent_id']);
        }
    }//up()

    public function down()
    {
        if ($this->has_column('directus_activity', 'user_agent')) {
            $this->remove_column('directus_activity', 'user_agent');
        }

        if (!$this->has_column('directus_activity', 'parent_table')) {
            $this->remove_column('directus_activity', 'parent_table');
        }
    }//down()
}
