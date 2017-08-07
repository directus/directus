<?php
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class DropShowXDirectusGroups extends Ruckusing_Migration_Base
{
    protected $types = ['activity', 'messages', 'users', 'files'];

    public function up()
    {
        foreach ($this->types as $type) {
            if ($this->has_column('directus_groups', 'show_' . $type)) {
                $this->remove_column('directus_groups', 'show_' . $type);
            }
        }
    }//up()

    public function down()
    {
        foreach ($this->types as $type) {
            if (!$this->has_column('directus_groups', 'show_' . $type)) {
                $this->add_column('directus_groups', 'show_' . $type, 'tinyinteger', [
                    'limit' => 1,
                    'null' => false,
                    'default' => 1
                ]);
            }
        }
    }//down()
}
