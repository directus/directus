<?php


use Phinx\Migration\AbstractMigration;

class RemoveFilePreview extends AbstractMigration
{
   public function up() {
       $this->execute("DELETE FROM directus_fields WHERE `collection` = 'directus_files' AND `field` = 'preview'");
   }
}
