<?php
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class AddDirectusActivityParentChangedDefault extends Ruckusing_Migration_Base
{
    public function up()
    {
        if ($this->has_column('directus_activity', 'parent_changed')) {
            $this->change_column('directus_activity', 'parent_changed', 'tinyinteger', [
                'limit' => 1,
                'null' => false,
                'default' => 0,
                'comment' => 'Did the top-level record in the change set alter (scalar values/many-to-one relationships)? Or only the data within its related foreign collection records? (*toMany)'
            ]);
        }
    }//up()

    public function down()
    {
        if ($this->has_column('directus_activity', 'parent_changed')) {
            $this->change_column('directus_activity', 'parent_changed', 'tinyinteger', [
                'limit' => 1,
                'null' => false,
                'comment' => 'Did the top-level record in the change set alter (scalar values/many-to-one relationships)? Or only the data within its related foreign collection records? (*toMany)'
            ]);
        }
    }//down()
}
