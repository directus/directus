<?php


use Phinx\Migration\AbstractMigration;

class LocaleInterface extends AbstractMigration
{
    public function up()
    {
        $this->execute("UPDATE directus_fields SET interface='language', options='{\"limit\":true}' WHERE collection='directus_users' AND field='locale';");
    }
}
