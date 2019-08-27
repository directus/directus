<?php

use Phinx\Migration\AbstractMigration;

class AddUsers2FASecretField extends AbstractMigration
{
    public function change()
    {
        $table = $this->table('directus_users');
        if (!$table->hasColumn('2fa_secret')) {
            $table->addColumn('2fa_secret', 'string', [
                'limit' => 255,
                'null' => true,
                'default' => null
            ]);

            $table->save();
        }

        $collection = 'directus_users';
        $field = '2fa_secret';
        $checkSql = sprintf('SELECT 1 FROM `directus_fields` WHERE `collection` = "%s" AND `field` = "%s";', $collection, $field);
        $result = $this->query($checkSql)->fetch();

        if (!$result) {
            $insertSqlFormat = 'INSERT INTO `directus_fields` (`collection`, `field`, `type`, `interface`, `readonly`, `hidden_detail`, `hidden_browse`) VALUES ("%s", "%s", "%s", "%s", "%s", "%s", "%s");';
            $insertSql = sprintf($insertSqlFormat, $collection, $field, 'string', '2fa-secret', 1, 0, 1);
            $this->execute($insertSql);
        }
    }
}
