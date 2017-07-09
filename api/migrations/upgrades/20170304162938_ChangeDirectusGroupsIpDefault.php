<?php

use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class ChangeDirectusGroupsIpDefault extends Ruckusing_Migration_Base
{
    public function up()
    {
        $this->change_column('directus_groups', 'restrict_to_ip_whitelist', 'text', [
            'default' => NULL
        ]);
    }//up()

    public function down()
    {
        $this->change_column('directus_groups', 'restrict_to_ip_whitelist', 'text', [
            'default' => ''
        ]);
    }//down()
}
