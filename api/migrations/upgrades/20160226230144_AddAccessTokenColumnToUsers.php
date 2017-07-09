<?php
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class AddAccessTokenColumnToUsers extends Ruckusing_Migration_Base
{
    public function up()
    {
        if (!$this->has_column('directus_users', 'access_token')) {
            $this->add_column('directus_users', 'access_token', 'string', [
                'limit' => 255,
                'default' => ''
            ]);
        }
    }//up()

    public function down()
    {
        if ($this->has_column('directus_users', 'access_token')) {
            $this->remove_column('directus_users', 'access_token');
        }
    }//down()
}
