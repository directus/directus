<?php
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class AddUseragentAndParentTableColumnToDirectusActivity extends Ruckusing_Migration_Base
{
    public function up()
    {
        $this->add_column('directus_activity', 'user_agent', 'string', array('limit' => 256));
        $this->add_column('directus_activity', 'parent_table', 'string', array('limit' => 100, 'after' => 'name'));
    }//up()

    public function down()
    {
        $this->remove_column('directus_activity', 'user_agent');
        $this->remove_column('directus_activity', 'parent_table');
    }//down()
}
