<?php


use Phinx\Migration\AbstractMigration;

class AddTrustedProxiesSettingField extends AbstractMigration
{
    public function up()
    {
        $result = $this->query('SELECT 1 FROM `directus_settings` WHERE `key` = "trusted_proxies";')->fetch();

        if (!$result) {
            $this->execute("INSERT INTO `directus_settings` (`key`, `value`) VALUES ('trusted_proxies', '');");
        }
    }
}
