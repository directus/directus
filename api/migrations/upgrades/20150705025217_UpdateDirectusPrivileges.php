<?php
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class UpdateDirectusPrivileges extends Ruckusing_Migration_Base
{
    public function up()
    {
        if (!$this->has_column('directus_privileges', 'to_view') && !$this->has_column('directus_privileges', 'allow_view')) {
            $this->add_column('directus_privileges', 'to_view', 'tinyinteger', [
                'limit' => 1,
                'null' => false,
                'default' => 0
            ]);
        }

        if (!$this->has_column('directus_privileges', 'to_add') && !$this->has_column('directus_privileges', 'allow_add')) {
            $this->add_column('directus_privileges', 'to_add', 'tinyinteger', [
                'limit' => 1,
                'null' => false,
                'default' => 0
            ]);
        }

        if (!$this->has_column('directus_privileges', 'to_edit') && !$this->has_column('directus_privileges', 'allow_edit')) {
            $this->add_column('directus_privileges', 'to_edit', 'tinyinteger', [
                'limit' => 1,
                'null' => false,
                'default' => 0
            ]);
        }

        if (!$this->has_column('directus_privileges', 'to_delete') && !$this->has_column('directus_privileges', 'allow_delete')) {
            $this->add_column('directus_privileges', 'to_delete', 'tinyinteger', [
                'limit' => 1,
                'null' => false,
                'default' => 0
            ]);
        }

        if (!$this->has_column('directus_privileges', 'to_alter') && !$this->has_column('directus_privileges', 'allow_alter')) {
            $this->add_column('directus_privileges', 'to_alter', 'tinyinteger', [
                'limit' => 1,
                'null' => false,
                'default' => 0
            ]);
        }

        if (!$this->has_column('directus_privileges', 'listed') && $this->has_column('directus_privileges', 'unlisted')) {
            $this->rename_column('directus_privileges', 'unlisted', 'listed');
        }

        if ($this->has_column('directus_privileges', 'permission') && $this->has_column('directus_privileges', 'listed')) {
            $tableName = $this->get_adapter()->identifier('directus_privileges');
            $columns = array_map(function ($columnName) {
                return $this->get_adapter()->identifier($columnName);
            }, ['id', 'permissions', 'listed']);

            $results = $this->execute('SELECT ' . implode(',', $columns) . ' FROM ' . $tableName);
            foreach ($results as $row) {
                $permissions = explode(',', $row['permissions']);
                $listed = $row['listed'] ? (int)$row['listed'] : 1;

                $view = 0;
                if (in_array('view', $permissions)) {
                    $view = 1;
                }
                if (in_array('bigview', $permissions)) {
                    $view = 2;
                }

                $add = in_array('add', $permissions) ? 1 : 0;

                $edit = 0;
                if (in_array('edit', $permissions)) {
                    $edit = 1;
                }
                if (in_array('bigedit', $permissions)) {
                    $edit = 2;
                }

                $delete = 0;
                if (in_array('delete', $permissions)) {
                    $delete = 1;
                }
                if (in_array('bigdelete', $permissions)) {
                    $delete = 2;
                }

                $alter = in_array('alter', $permissions) ? 1 : 0;

                $this->update('directus_privileges', [
                    'listed' => $listed,
                    'to_view' => $view,
                    'to_add' => $add,
                    'to_edit' => $edit,
                    'to_delete' => $delete,
                    'to_alter' => $alter
                ], [
                    'id' => $row['id']
                ]);
            }

            $this->remove_column('directus_privileges', 'permissions');
        }
    }//up()

    public function down()
    {
        // we wont use this.
    }//down()
}
