<?php
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class DropSocialTables extends Ruckusing_Migration_Base
{
    public function up()
    {
        $this->drop_table('directus_social_feeds');
        $this->drop_table('directus_social_posts');
    }//up()

    public function down()
    {
        // do we need this table?
    }//down()
}
