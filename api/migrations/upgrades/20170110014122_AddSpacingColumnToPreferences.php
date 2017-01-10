<?php

use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class AddSpacingColumnToPreferences extends Ruckusing_Migration_Base
{
    public function up()
    {
        if (!$this->has_column('directus_preferences', 'spacing')) {
            $this->add_column('directus_preferences', 'spacing', 'string', [
                'limit' => 32
            ]);
        }
    }//up()

    public function down()
    {
        if ($this->has_column('directus_preferences', 'spacing')) {
            $this->remove_column('directus_preferences', 'spacing');
        }
    }//down()
}
