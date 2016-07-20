<?php
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class AddTimezoneColumnToUsers extends Ruckusing_Migration_Base
{
    public function up()
    {
        $this->add_column('directus_users', 'timezone', 'string', array(
            'limit' => 32,
            'default' => ''
        ));
    }//up()

    public function down()
    {
        $this->remove_column('directus_users', 'timezone');
    }//down()
}
