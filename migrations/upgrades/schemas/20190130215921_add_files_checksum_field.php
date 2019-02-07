<?php

use Phinx\Migration\AbstractMigration;

class AddFilesChecksumField extends AbstractMigration
{
    public function change()
    {
        $table = $this->table('directus_files');
        if (!$table->hasColumn('checksum')) {
            $table->addColumn('checksum', 'string', [
                'limit' => 32,
                'null' => true,
                'default' => null
            ]);

            $table->save();
        }

        $result = $this->query('SELECT 1 FROM `directus_fields` WHERE `collection` = "directus_files" AND `field` = "checksum";')->fetch();
        if (!$result) {
            $this->execute('INSERT INTO `directus_fields` (`collection`, `field`, `type`, `interface`) VALUES ("directus_files", "checksum", "string", "text-input");');
        }
    }
}
