<?php
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class AddNavBlacklistDirectusGroups extends Ruckusing_Migration_Base
{
    public function up()
    {
        $this->add_column('directus_groups', 'nav_blacklist', 'string', array(
          'limit' => 500,
          'default' => NULL
        ));
    }//up()

    public function down()
    {
        $this->remove_column('directus_groups', 'nav_blacklist');
    }//down()
}
