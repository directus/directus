<?php
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class DropHiddenListDirectusColumns extends Ruckusing_Migration_Base
{
    public function up()
    {
        if ($this->has_column('directus_columns', 'hidden_list')) {
            $this->remove_column('directus_columns', 'hidden_list');
        }
    }//up()

    public function down()
    {
        if (!$this->has_column('directus_columns', 'hidden_list')) {
            $this->add_column('directus_columns', 'hidden_list', 'tinyinteger', [
                'limit' => 1,
                'null' => false,
                'default' => 0
            ]);
        }
    }//down()
}
