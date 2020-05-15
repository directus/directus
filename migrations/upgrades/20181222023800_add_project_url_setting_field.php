<?php

use Phinx\Migration\AbstractMigration;

class AddProjectUrlSettingField extends AbstractMigration
{
    public function up()
    {
        $result = $this->query('SELECT 1 FROM `directus_settings` WHERE `key` = "project_url";')->fetch();

        if (!$result) {
            $this->execute("INSERT INTO `directus_settings` (`key`, `value`) VALUES ('project_url', '');");
        }
    }
}
