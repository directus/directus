<?php
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class AddNavOverrideDirectusGroups extends Ruckusing_Migration_Base
{
    public function up()
    {
        if (!$this->has_column('directus_groups', 'nav_override')) {
            $this->add_column('directus_groups', 'nav_override', 'text');
        }
    }//up()

    public function down()
    {
        if ($this->has_column('directus_groups', 'nav_override')) {
            $this->remove_column('directus_groups', 'nav_override');
        }
    }//down()
}
