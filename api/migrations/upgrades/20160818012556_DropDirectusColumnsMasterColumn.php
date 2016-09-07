<?php
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class DropDirectusColumnsMasterColumn extends Ruckusing_Migration_Base
{
    public function up()
    {
        if ($this->has_column('directus_columns', 'master')) {
            $this->remove_column('directus_columns', 'master');
        }
    }//up()

    public function down()
    {
        if (!$this->has_column('directus_columns', 'master')) {
            $this->add_column('master', 'tinyinteger', [
                'limit' => 1,
                'null' => false,
                'default' => 0
            ]);
        }
    }//down()
}
