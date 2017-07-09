<?php
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class AddCountryColumnToUsers extends Ruckusing_Migration_Base
{
    public function up()
    {
        if (!$this->has_column('directus_users', 'country')) {
            $this->add_column('directus_users', 'country', 'char', [
                'limit' => 2,
                'default' => null,
                'after' => 'state'
            ]);
        }
    }//up()

    public function down()
    {
        if ($this->has_column('directus_users', 'country')) {
            $this->remove_column('directus_users', 'country');
        }
    }//down()
}
