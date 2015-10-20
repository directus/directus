<?php
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class UpdateSiteNameUrlDirectusSettings extends Ruckusing_Migration_Base
{
    public function up()
    {
        $this->execute('UPDATE `directus_settings` 
                            SET name = "project_name"
                            WHERE name = "site_name" AND collection = "global"');
        $this->execute('UPDATE `directus_settings` 
                            SET name = "project_url"
                            WHERE name = "site_url" AND collection = "global"');
    }//up()

    public function down()
    {
        $this->execute('UPDATE `directus_settings` 
                            SET name = "site_name"
                            WHERE name = "project_name" AND collection = "global"');
        $this->execute('UPDATE `directus_settings` 
                            SET name = "site_url"
                            WHERE name = "project_url" AND collection = "global"');
    }//down()
}
