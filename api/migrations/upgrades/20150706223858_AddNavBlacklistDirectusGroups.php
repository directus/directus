<?php
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class AddNavBlacklistDirectusGroups extends Ruckusing_Migration_Base
{
    public function up()
    {
        if (!$this->has_column('directus_groups', 'nav_blacklist')) {
            $this->add_column('directus_groups', 'nav_blacklist', 'string', [
                'limit' => 500,
                'default' => NULL
            ]);
        }
    }//up()

    public function down()
    {
        if ($this->has_column('directus_groups', 'nav_blacklist')) {
            $this->remove_column('directus_groups', 'nav_blacklist');
        }
    }//down()
}
