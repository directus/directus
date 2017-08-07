<?php
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class UsersTokenNullable extends Ruckusing_Migration_Base
{
    public function up()
    {
        $this->change_column('directus_users', 'token', 'string', [
            'limit' => 128,
            'null' => true
        ]);
    }//up()

    public function down()
    {
        $this->change_column('directus_users', 'token', 'string', [
            'limit' => 128,
            'null' => false,
            'default' => ''
        ]);
    }//down()
}
