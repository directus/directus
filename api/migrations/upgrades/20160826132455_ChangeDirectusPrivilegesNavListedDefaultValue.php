<?php
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class ChangeDirectusPrivilegesNavListedDefaultValue extends Ruckusing_Migration_Base
{
    public function up()
    {
        if ($this->has_column('directus_privileges', 'nav_listed')) {
            $this->change_column('directus_privileges', 'nav_listed', 'tinyinteger', [
                'null' => false,
                'limit' => 1,
                'default' => 1
            ]);
        }
    }//up()

    public function down()
    {
        if ($this->has_column('directus_privileges', 'nav_listed')) {
            $this->change_column('directus_privileges', 'nav_listed', 'tinyinteger', [
                'null' => false,
                'limit' => 1,
                'default' => 0
            ]);
        }
    }//down()
}
