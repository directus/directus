<?php
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class UpdateDirectusPrivilegesTableDefault extends Ruckusing_Migration_Base
{
    public function up()
    {
        $this->change_column('directus_privileges', 'allow_view', 'tinyinteger', array(
            'default' => 0
        ));

        $this->change_column('directus_privileges', 'allow_add', 'tinyinteger', array(
            'default' => 0
        ));

        $this->change_column('directus_privileges', 'allow_edit', 'tinyinteger', array(
            'default' => 0
        ));

        $this->change_column('directus_privileges', 'allow_delete', 'tinyinteger', array(
            'default' => 0
        ));

        $this->change_column('directus_privileges', 'allow_alter', 'tinyinteger', array(
            'default' => 0
        ));

        $this->change_column('directus_privileges', 'nav_listed', 'tinyinteger', array(
            'default' => 0
        ));
    }//up()

    public function down()
    {
        $this->change_column('directus_privileges', 'allow_view', 'tinyinteger', array(
            'default' => 1
        ));

        $this->change_column('directus_privileges', 'allow_add', 'tinyinteger', array(
            'default' => 1
        ));

        $this->change_column('directus_privileges', 'allow_edit', 'tinyinteger', array(
            'default' => 1
        ));

        $this->change_column('directus_privileges', 'allow_delete', 'tinyinteger', array(
            'default' => 1
        ));

        $this->change_column('directus_privileges', 'allow_alter', 'tinyinteger', array(
            'default' => 1
        ));

        $this->change_column('directus_privileges', 'nav_listed', 'tinyinteger', array(
            'default' => 1
        ));
    }//down()
}
