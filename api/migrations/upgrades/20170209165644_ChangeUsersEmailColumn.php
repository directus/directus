<?php
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class ChangeUsersEmailColumn extends Ruckusing_Migration_Base
{
    public function up()
    {
        if ($this->has_column('directus_users', 'email')) {
            $this->change_column('directus_users', 'email', 'string', [
                'limit' => 128,
                'null' => false,
                'default' => ''
            ]);
        }
    }//up()

    public function down()
    {
        if ($this->has_column('directus_users', 'email')) {
            $this->change_column('directus_users', 'email', 'string', [
                'limit' => 255,
                'default' => ''
            ]);
        }
    }//down()
}
