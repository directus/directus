<?php
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class DropDirectusIpWhitelist extends Ruckusing_Migration_Base
{
    public function up()
    {
        if ($this->has_table('directus_ip_whitelist')) {
            $this->drop_table('directus_ip_whitelist');
        }
    }//up()

    public function down()
    {
        // we actually dont need this anymore
    }//down()
}
