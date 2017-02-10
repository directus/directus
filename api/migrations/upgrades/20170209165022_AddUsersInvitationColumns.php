<?php

use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class AddUsersInvitationColumns extends Ruckusing_Migration_Base
{
    public function up()
    {
        $tableName = 'directus_users';

        if (!$this->has_column($tableName, 'invite_token')) {
            $this->add_column($tableName, 'invite_token', 'string', [
                'limit' => 255,
                'default' => null
            ]);
        }

        if (!$this->has_column($tableName, 'invite_date')) {
            $this->add_column($tableName, 'invite_date', 'datetime', [
                'default' => null
            ]);
        }

        if (!$this->has_column($tableName, 'invite_accepted')) {
            $this->add_column($tableName, 'invite_accepted', 'tinyinteger', [
                'limit' => 1,
                'default' => null
            ]);
        }

        if (!$this->has_column($tableName, 'invite_sender')) {
            $this->add_column($tableName, 'invite_sender', 'integer', [
                'unsigned' => true,
                'default' => null
            ]);
        }
    }

    public function down()
    {
        $tableName = 'directus_users';
        $columns = [
            'invite_token',
            'invite_date',
            'invite_sender',
            'invite_accepted'
        ];

        foreach($columns as $column) {
            if ($this->has_column($tableName, $column)) {
                $this->remove_column($tableName, $column);
            }
        }
    }
}
