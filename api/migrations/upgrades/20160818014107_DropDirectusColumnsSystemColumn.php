<?php
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class DropDirectusColumnsSystemColumn extends Ruckusing_Migration_Base
{
    public function up()
    {
        if ($this->has_column('directus_columns', 'system')) {
            $this->remove_column('directus_columns', 'system');
        }
    }//up()

    public function down()
    {
        if (!$this->has_column('directus_columns', 'system')) {
            $this->add_column('system', 'tinyinteger', [
                'limit' => 1,
                'null' => false,
                'default' => 0
            ]);
        }
    }//down()
}
