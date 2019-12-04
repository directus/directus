<?php


use Phinx\Migration\AbstractMigration;

class RemoveScope extends AbstractMigration
{
    public function up()
    {
        $table = $this->table('directus_settings');

        if ($table->hasColumn('scope')) {
            $oldIndexName = 'idx_scope_name';
            // NOTE: Update to a more recent version of Phinx
            // It implements the $table->hasIndexByName($oldIndexName);
            if ($table->getAdapter()->hasIndexByName($table->getName(), $oldIndexName)) {
                $table->removeIndexByName($oldIndexName);
            }

            $table->removeColumn('scope')
                ->save();
            $table->addIndex(['key'], [
                'unique' => true,
                'name' => 'idx_key'
            ]);
        }
    }
}
