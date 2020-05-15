<?php

namespace Directus;

use Directus\Application\Application;
use Directus\Database\TableGatewayFactory;
use Zend\Db\Sql\Select;
use Zend\Db\TableGateway\TableGateway;

if (!function_exists('get_item_owner')) {
    /**
     * Gets the item's owner ID
     *
     * @param string $collection
     * @param mixed $id
     *
     * @return array
     */
    function get_item_owner($collection, $id)
    {
        $app = Application::getInstance();
        $dbConnection = $app->getContainer()->get('database');
        $tableGateway = new TableGateway($collection, $dbConnection);
        /** @var \Directus\Database\TableGateway\RelationalTableGateway $tableGateway */
        $usersTableGateway = TableGatewayFactory::create($collection, [
            'connection' => $dbConnection,
            'acl' => false
        ]);

        /** @var \Directus\Database\Schema\SchemaManager $schemaManager */
        $schemaManager = $app->getContainer()->get('schema_manager');

        $collectionObject = $schemaManager->getCollection($collection);
        $userCreatedField = $collectionObject->getUserCreatedField();

        $owner = null;
        if ($userCreatedField) {
            $fieldName = $userCreatedField->getName();
            $select = new Select(
                ['c' => $tableGateway->table]
            );
            $select->limit(1);
            $select->columns([]);
            $select->where([
                'c.' . $collectionObject->getPrimaryKeyName() => $id
            ]);

            $subSelect = new Select('directus_users');

            $select->join(
                ['ur' => $subSelect],
                sprintf('c.%s = ur.id', $fieldName),
                [
                    'id',
                    'role'
                ],
                $select::JOIN_LEFT
            );

            $owner = $tableGateway->selectWith($select)->toArray();
            $owner = $usersTableGateway->parseRecord(reset($owner), 'directus_users');
        }

        return $owner;
    }
}

if (!function_exists('get_user_ids_in_group')) {
    function get_user_ids_in_group(array $roleIds)
    {
        $id = array_shift($roleIds);
        $app = Application::getInstance();
        $dbConnection = $app->getContainer()->get('database');
        $tableGateway = new TableGateway('directus_users', $dbConnection);

        $select = new Select($tableGateway->table);
        $select->columns(['id']);
        $select->where(['role' => $id]);

        $result = $tableGateway->selectWith($select);

        $ids = [];
        foreach ($result as $row) {
            $ids[] = $row->id;
        }

        return $ids;
    }
}
