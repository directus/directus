<?php
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class UpdatePermissionFieldsDirectusPrivileges extends Ruckusing_Migration_Base
{
    public function up()
    {
        $this->rename_column('directus_privileges', 'to_view', 'allow_view');
        $this->change_column('directus_privileges', 'allow_view', 'tinyinteger', array(
            'null' => false,
            'default' => 1
        ));
        $this->rename_column('directus_privileges', 'to_add', 'allow_add');
        $this->change_column('directus_privileges', 'allow_add', 'tinyinteger', array(
            'null' => false,
            'default' => 1
        ));
        $this->rename_column('directus_privileges', 'to_edit', 'allow_edit');
        $this->change_column('directus_privileges', 'allow_edit', 'tinyinteger', array(
            'null' => false,
            'default' => 1
        ));
        $this->rename_column('directus_privileges', 'to_delete', 'allow_delete');
        $this->change_column('directus_privileges', 'allow_delete', 'tinyinteger', array(
            'null' => false,
            'default' => 1
        ));
        $this->rename_column('directus_privileges', 'to_alter', 'allow_alter');
        $this->change_column('directus_privileges', 'allow_alter', 'tinyinteger', array(
            'null' => false,
            'default' => 1
        ));
        $this->rename_column('directus_privileges', 'listed', 'nav_listed');
        $this->change_column('directus_privileges', 'nav_listed', 'tinyinteger', array(
            'null' => false,
            'default' => 1
        ));
    }//up()

    public function down()
    {
        $this->rename_column('directus_privileges', 'allow_view', 'to_view');
        $this->rename_column('directus_privileges', 'allow_add', 'to_add');
        $this->rename_column('directus_privileges', 'allow_edit', 'to_edit');
        $this->rename_column('directus_privileges', 'allow_delete', 'to_delete');
        $this->rename_column('directus_privileges', 'allow_alter', 'to_alter');
        $this->rename_column('directus_privileges', 'nav_listed', 'listed');
    }//down()
}
