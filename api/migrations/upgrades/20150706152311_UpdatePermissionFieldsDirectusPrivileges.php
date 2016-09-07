<?php
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class UpdatePermissionFieldsDirectusPrivileges extends Ruckusing_Migration_Base
{
    public function up()
    {
        $tableName = 'directus_privileges';

        if (!$this->has_column($tableName, 'allow_view') && $this->has_column($tableName, 'to_view')) {
            $this->rename_column('directus_privileges', 'to_view', 'allow_view');
            $this->change_column('directus_privileges', 'allow_view', 'tinyinteger', [
                'null' => false,
                'default' => 1
            ]);
        }

        if (!$this->has_column($tableName, 'allow_add') && $this->has_column($tableName, 'to_add')) {
            $this->rename_column('directus_privileges', 'to_add', 'allow_add');
            $this->change_column('directus_privileges', 'allow_add', 'tinyinteger', [
                'null' => false,
                'default' => 1
            ]);
        }

        if (!$this->has_column($tableName, 'allow_edit') && $this->has_column($tableName, 'to_edit')) {
            $this->rename_column('directus_privileges', 'to_edit', 'allow_edit');
            $this->change_column('directus_privileges', 'allow_edit', 'tinyinteger', [
                'null' => false,
                'default' => 1
            ]);
        }

        if (!$this->has_column($tableName, 'allow_delete') && $this->has_column($tableName, 'to_delete')) {
            $this->rename_column('directus_privileges', 'to_delete', 'allow_delete');
            $this->change_column('directus_privileges', 'allow_delete', 'tinyinteger', [
                'null' => false,
                'default' => 1
            ]);
        }

        if (!$this->has_column($tableName, 'allow_alter') && $this->has_column($tableName, 'to_alter')) {
            $this->rename_column('directus_privileges', 'to_alter', 'allow_alter');
            $this->change_column('directus_privileges', 'allow_alter', 'tinyinteger', [
                'null' => false,
                'default' => 1
            ]);
        }

        if (!$this->has_column($tableName, 'nav_listed') && $this->has_column($tableName, 'listed')) {
            $this->rename_column('directus_privileges', 'listed', 'nav_listed');
            $this->change_column('directus_privileges', 'nav_listed', 'tinyinteger', [
                'null' => false,
                'limit' => 1,
                'default' => 0
            ]);
        }
    }//up()

    public function down()
    {
        $tableName = 'directus_privileges';

        if ($this->has_column($tableName, 'allow_view') && !$this->has_column($tableName, 'to_view')) {
            $this->rename_column('directus_privileges', 'allow_view', 'to_view');
        }

        if ($this->has_column($tableName, 'allow_add') && !$this->has_column($tableName, 'to_add')) {
            $this->rename_column('directus_privileges', 'allow_add', 'to_add');
        }

        if ($this->has_column($tableName, 'allow_edit') && !$this->has_column($tableName, 'to_edit')) {
            $this->rename_column('directus_privileges', 'allow_edit', 'to_edit');
        }

        if ($this->has_column($tableName, 'allow_delete') && !$this->has_column($tableName, 'to_delete')) {
            $this->rename_column('directus_privileges', 'allow_delete', 'to_delete');
        }

        if ($this->has_column($tableName, 'allow_alter') && !$this->has_column($tableName, 'to_alter')) {
            $this->rename_column('directus_privileges', 'allow_alter', 'to_alter');
        }

        if ($this->has_column($tableName, 'nav_listed') && !$this->has_column($tableName, 'listed')) {
            $this->rename_column('directus_privileges', 'nav_listed', 'listed');
        }
    }//down()
}
