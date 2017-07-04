<?php
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class ChangePreferencesStatusLimit extends Ruckusing_Migration_Base
{
    public function up()
    {
        $this->change_column('directus_preferences', 'status', 'string', [
            'limit' => 64
        ]);
    }//up()

    public function down()
    {
        $this->change_column('directus_preferences', 'status', 'string', [
            'limit' => 5
        ]);
    }//down()
}
