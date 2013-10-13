<?php

namespace Directus\Db\TableGateway;

use Directus\Acl\Acl;
use Directus\Db\TableGateway\AclAwareTableGateway;
use Directus\Db\TableSchema;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Sql\Predicate;
use Zend\Db\Sql\Sql;
use Zend\Db\Sql\Select;
use Zend\Db\Sql\Where;

class DirectusActivityTableGateway extends RelationalTableGateway {

    // Populates directus_activity.type
    const TYPE_ENTRY    = "ENTRY";
    const TYPE_MEDIA    = "MEDIA";
    const TYPE_SETTINGS = "SETTINGS";
    const TYPE_UI       = "UI";

    // Populates directus_activity.action
    const ACTION_ADD    = "ADD";
    const ACTION_UPDATE = "UPDATE";

    public static $_tableName = "directus_activity";

    public static function makeLogTypeFromTableName($table) {
        switch($table) {
            // @todo these first two are assumptions. are they correct?
            case 'directus_ui':
                return self::TYPE_UI;
            case 'directus_settings':
                return self::TYPE_SETTINGS;
            case "directus_media":
                return self::TYPE_MEDIA;
            default:
                return self::TYPE_ENTRY;
        }
    }

    public function __construct(Acl $acl, AdapterInterface $adapter) {
        parent::__construct($acl, self::$_tableName, $adapter);
    }

    public function fetchFeed($params = null) {

        $sql = new Sql($this->adapter);
        $select = $sql->select()->from($this->table);

        $params['orderColumn'] = 'id';
        $params['orderDirection'] = 'DESC';

        $tableSchemaArray = TableSchema::getSchemaArray($this->table);
        $hasActiveColumn = $this->schemaHasActiveColumn($tableSchemaArray);
        $params = $this->applyDefaultEntriesSelectParams($params);

        $columns = array('id','identifier','action','table_name','row_id','user','datetime','type');
        $select->columns($columns);
            // ->order('id DESC');
        $select
            ->where
                ->isNull('parent_id')
                ->OR
                ->equalTo('type', 'MEDIA');

        $select = $this->applyParamsToTableEntriesSelect($params, $select, $tableSchemaArray, $hasActiveColumn);

        // die($this->dumpSql($select));

        $rowset = $this->selectWith($select);
        $rowset = $rowset->toArray();

        foreach ($rowset as &$row) {
            $row['datetime'] .= ' UTC';
        }

        $countTotalWhere = new Where;
        $countTotalWhere
            ->isNull('parent_id')
            ->OR
            ->equalTo('type', 'MEDIA');
        $activityTotal = $this->countTotal($countTotalWhere);

        return array(
            'total' => $activityTotal,
            'rows' => $rowset
        );
    }

    public function fetchRevisions($row_id, $table_name) {
        $columns = array('id','action','user','datetime');

        $sql = new Sql($this->adapter);
        $select = $sql->select()
            ->from($this->table)
            ->columns($columns)
            ->order('id DESC');
        $select
            ->where
                ->equalTo('row_id', $row_id)
                ->AND
                ->equalTo('table_name', $table_name);

        $result = $this->selectWith($select);
        $result = $result->toArray();

        foreach ($result as &$row) {
            $row['datetime'] .= ' UTC';
        }

        return $result;
    }

}
