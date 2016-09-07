<?php
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class UpdateDirectusPrivilegesTableDefault extends Ruckusing_Migration_Base
{
    public function up()
    {
        $this->change_column('directus_privileges', 'allow_view', 'tinyinteger', [
            'default' => 0
        ]);

        $this->change_column('directus_privileges', 'allow_add', 'tinyinteger', [
            'default' => 0
        ]);

        $this->change_column('directus_privileges', 'allow_edit', 'tinyinteger', [
            'default' => 0
        ]);

        $this->change_column('directus_privileges', 'allow_delete', 'tinyinteger', [
            'default' => 0
        ]);

        $this->change_column('directus_privileges', 'allow_alter', 'tinyinteger', [
            'default' => 0
        ]);

        $this->change_column('directus_privileges', 'nav_listed', 'tinyinteger', [
            'default' => 0
        ]);
    }//up()

    public function down()
    {
        $this->change_column('directus_privileges', 'allow_view', 'tinyinteger', [
            'default' => 1
        ]);

        $this->change_column('directus_privileges', 'allow_add', 'tinyinteger', [
            'default' => 1
        ]);

        $this->change_column('directus_privileges', 'allow_edit', 'tinyinteger', [
            'default' => 1
        ]);

        $this->change_column('directus_privileges', 'allow_delete', 'tinyinteger', [
            'default' => 1
        ]);

        $this->change_column('directus_privileges', 'allow_alter', 'tinyinteger', [
            'default' => 1
        ]);

        $this->change_column('directus_privileges', 'nav_listed', 'tinyinteger', [
            'default' => 1
        ]);
    }//down()
}
