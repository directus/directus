<?php
use Ruckusing\Migration\Base as Ruckusing_Migration_Base;

class RenameDirectusUsersLocaleColumnToLanguage extends Ruckusing_Migration_Base
{
    public function up()
    {
        $this->rename_column('directus_users', 'locale', 'language');
        $this->change_column('directus_users', 'language', 'string', array(
            'limit' => 8,
            'default' => 'en'
        ));
    }//up()

    public function down()
    {
        $this->rename_column('directus_users', 'language', 'locale');
        $this->change_column('directus_users', 'language', 'string', array(
            'limit' => 32,
            'default' => 'en'
        ));
    }//down()
}
