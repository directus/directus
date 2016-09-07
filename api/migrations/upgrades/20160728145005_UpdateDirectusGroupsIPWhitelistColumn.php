<?php
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class UpdateDirectusGroupsIPWhitelistColumn extends Ruckusing_Migration_Base
{
    public function up()
    {
        $this->change_column('directus_groups', 'restrict_to_ip_whitelist', 'text', [
            'null' => true
        ]);
    }//up()

    public function down()
    {
        $this->change_column('directus_groups', 'restrict_to_ip_whitelist', 'tinyinteger', [
            'limit' => 1,
            'null' => false,
            'default' => 0
        ]);
    }//down()
}
