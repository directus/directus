<?php
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class AddTimezoneColumnToUsers extends Ruckusing_Migration_Base
{
    public function up()
    {
        if (!$this->has_column('directus_users', 'timezone')) {
            $this->add_column('directus_users', 'timezone', 'string', [
                'limit' => 32,
                'default' => ''
            ]);
        }
    }//up()

    public function down()
    {
        if ($this->has_column('directus_users', 'timezone')) {
            $this->remove_column('directus_users', 'timezone');
        }
    }//down()
}
