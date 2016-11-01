<?php

namespace Directus\Database\TableGateway;

use Directus\Acl\Acl;
use Directus\Database\TableSchema;
use Directus\Util\DateUtils;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Sql\Insert;
use Zend\Db\Sql\Predicate;
use Zend\Db\Sql\Sql;
use Zend\Db\Sql\Where;

class DirectusActivityTableGateway extends RelationalTableGateway
{
    // Populates directus_activity.type
    const TYPE_ENTRY = 'ENTRY';
    const TYPE_FILES = 'FILES';
    const TYPE_SETTINGS = 'SETTINGS';
    const TYPE_UI = 'UI';
    const TYPE_LOGIN = 'LOGIN';
    const TYPE_MESSAGE = 'MESSAGE';

    // Populates directus_activity.action
    const ACTION_ADD = 'ADD';
    const ACTION_UPDATE = 'UPDATE';
    const ACTION_DELETE = 'DELETE';
    const ACTION_LOGIN = 'LOGIN';

    public static $_tableName = 'directus_activity';

    public static function makeLogTypeFromTableName($table)
    {
        switch ($table) {
            // @todo these first two are assumptions. are they correct?
            case 'directus_ui':
                return self::TYPE_UI;
            case 'directus_settings':
                return self::TYPE_SETTINGS;
            case 'directus_files':
                return self::TYPE_FILES;
            default:
                return self::TYPE_ENTRY;
        }
    }

    public function __construct(AdapterInterface $adapter, $acl)
    {
        parent::__construct(self::$_tableName, $adapter, $acl);
    }

    public function fetchFeed($params = null)
    {
        $sql = new Sql($this->adapter);
        $select = $sql->select()->from($this->table);

        $params['orderColumn'] = 'id';
        $params['orderDirection'] = 'DESC';

        $tableSchemaArray = TableSchema::getSchemaArray($this->table);
        $hasActiveColumn = $this->schemaHasActiveColumn($tableSchemaArray);
        $params = $this->applyDefaultEntriesSelectParams($params);

        $columns = ['id', 'identifier', 'action', 'table_name', 'row_id', 'user', 'datetime', 'type', 'data'];
        $select->columns($columns);
        // ->order('id DESC');
        $select
            ->where
            ->nest
            ->isNull('parent_id')
            ->OR
            ->equalTo('type', 'FILES')
            ->unnest;

        $select = $this->applyParamsToTableEntriesSelect($params, $select, $tableSchemaArray, $hasActiveColumn);

        //die($this->dumpSql($select));

        $rowset = $this->selectWith($select);
        $rowset = $rowset->toArray();
        $rowset = $this->convertDates($rowset, $tableSchemaArray);

        //        @TODO: Returns date in ISO 8601 Ex: 2016-06-06T17:18:20Z
        //        see: https://en.wikipedia.org/wiki/ISO_8601
        //        foreach ($rowset as &$row) {
        //            $row['datetime'] .= ' UTC';
        //        }

        $countTotalWhere = new Where;
        $countTotalWhere
            ->isNull('parent_id')
            ->OR
            ->equalTo('type', 'FILES');
        $activityTotal = $this->countTotal($countTotalWhere);

        return [
            'total' => $activityTotal,
            'rows' => $rowset
        ];
    }

    public function fetchRevisions($row_id, $table_name)
    {
        $columns = ['id', 'action', 'user', 'datetime'];

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
        //        @TODO: Returns date in ISO 8601 Ex: 2016-06-06T17:18:20Z
        //        see: https://en.wikipedia.org/wiki/ISO_8601
        //        foreach ($result as &$row) {
        //            $row['datetime'] .= ' UTC';
        //        }

        return $result;
    }

    public function recordLogin($userid)
    {
        $logData = [
            'type' => self::TYPE_LOGIN,
            'table_name' => 'directus_users',
            'action' => self::ACTION_LOGIN,
            'user' => $userid,
            'datetime' => DateUtils::now(),
            'parent_id' => null,
            'logged_ip' => isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '',
            'user_agent' => isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : ''
        ];

        $insert = new Insert($this->getTable());
        $insert
            ->values($logData);

        $this->insertWith($insert);
    }

    public function recordMessage($data, $userId)
    {
        if (isset($data['response_to']) && $data['response_to'] > 0) {
            $action = 'REPLY';
        } else {
            $action = 'ADD';
        }

        $logData = [
            'type' => self::TYPE_MESSAGE,
            'table_name' => 'directus_messages',
            'action' => $action,
            'user' => $userId,
            'datetime' => DateUtils::now(),
            'parent_id' => null,
            'data' => json_encode($data),
            'delta' => '[]',
            'identifier' => $data['subject'],
            'row_id' => $data['id'],
            'logged_ip' => isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '',
            'user_agent' => isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : ''
        ];

        $insert = new Insert($this->getTable());

        $insert
            ->values($logData);

        $this->insertWith($insert);
    }
}
