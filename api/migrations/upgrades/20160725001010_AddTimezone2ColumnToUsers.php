<?php
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class AddTimezone2ColumnToUsers extends Ruckusing_Migration_Base
{
    public function up()
    {
        if (!$this->has_column('directus_users', 'timezone2')) {
            $this->add_column('directus_users', 'timezone2', 'string', array(
                'limit' => 32,
                'default' => ''
            ));
        }
    }//up()

    public function down()
    {
        if ($this->has_column('directus_users', 'timezone2')) {
            $this->remove_column('directus_users', 'timezone2');
        }
    }//down()
}
