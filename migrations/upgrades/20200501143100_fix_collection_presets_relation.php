<?php


use Phinx\Migration\AbstractMigration;

class FixCollectionPresetsRelation extends AbstractMigration
{
   public function up() {
       $this->execute("DELETE FROM directus_relations WHERE collection_many = 'directus_collections_presets'");
       $this->execute("INSERT INTO directus_relations (collection_many, field_many, collection_one) VALUES ('directus_collection_presets', 'role', 'directus_roles')");
       $this->execute("INSERT INTO directus_relations (collection_many, field_many, collection_one) VALUES ('directus_collection_presets', 'user', 'directus_users')");
   }
}
