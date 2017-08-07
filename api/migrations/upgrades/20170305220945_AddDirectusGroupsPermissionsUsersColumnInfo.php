<?php

use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class AddDirectusGroupsPermissionsUsersColumnInfo extends Ruckusing_Migration_Base
{
    public function up()
    {
        try {
            $this->insert('directus_columns', [
                'table_name' => 'directus_groups',
                'column_name' => 'users',
                'data_type' => 'ALIAS',
                'ui' => 'directus_users',
                'hidden_input' => 0,
                'required' => 0,
                'relationship_type' => 'ONETOMANY',
                'related_table' => 'directus_users',
                'junction_table' => NULL,
                'junction_key_left' => NULL,
                'junction_key_right' => 'group'
            ]);

            $this->insert('directus_columns', [
                'table_name' => 'directus_groups',
                'column_name' => 'permissions',
                'data_type' => 'ALIAS',
                'ui' => 'directus_permissions',
                'hidden_input' => 0,
                'required' => 0,
                'relationship_type' => 'ONETOMANY',
                'related_table' => 'directus_privileges',
                'junction_table' => NULL,
                'junction_key_left' => NULL,
                'junction_key_right' => 'group_id'
            ]);
        } catch (\Exception $e) {
            //
        }
    }//up()

    public function down()
    {
    }//down()
}
