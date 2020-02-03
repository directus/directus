<?php

use Phinx\Migration\AbstractMigration;

class UpdateValidationSizeForDirectusField extends AbstractMigration
{
    public function change()
    {
        $fieldsTable = $this->table('directus_fields');

        // -------------------------------------------------------------------------
        // Update validation column
        // -------------------------------------------------------------------------
        if ($fieldsTable->hasColumn('validation')) {
            $fieldsTable->changeColumn('validation', 'string', [
                'limit' => 500,
                'null' => true
            ])->update();
        }
    }
}
