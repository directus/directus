<?php

use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class ChangeDirectusActivityIpLength extends Ruckusing_Migration_Base
{
    public function up()
    {
        // See: https://github.com/directus/directus/issues/2017
        $this->change_column('directus_activity', 'logged_ip', 'string', [
            'limit' => 45
        ]);
    }//up()

    public function down()
    {
        $this->change_column('directus_activity', 'logged_ip', 'string', [
            'limit' => 20
        ]);
    }//down()
}
