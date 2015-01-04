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
use Zend\Db\Sql\Insert;

class DirectusActivityTableGateway extends RelationalTableGateway {

    // Populates directus_activity.type
    const TYPE_ENTRY    = "ENTRY";
    const TYPE_FILES    = "FILES";
    const TYPE_SETTINGS = "SETTINGS";
    const TYPE_UI       = "UI";
    const TYPE_LOGIN    = "LOGIN";
    const TYPE_MESSAGE    = "MESSAGE";

    // Populates directus_activity.action
    const ACTION_ADD    = "ADD";
    const ACTION_UPDATE = "UPDATE";
    const ACTION_DELETE = "DELETE";
    const ACTION_LOGIN = "LOGIN";

    public static $_tableName = "directus_activity";

    public static function makeLogTypeFromTableName($table) {
        switch($table) {
            // @todo these first two are assumptions. are they correct?
            case 'directus_ui':
                return self::TYPE_UI;
            case 'directus_settings':
                return self::TYPE_SETTINGS;
            case "directus_files":
                return self::TYPE_FILES;
            default:
                return self::TYPE_ENTRY;
        }
    }

    public function __construct(Acl $acl, AdapterInterface $adapter) {
        parent::__construct($acl, self::$_tableName, $adapter);

        self::$defaultEntriesSelectParams = array(
          'orderBy' => 'id', // @todo validate $params['order*']
          'orderDirection' => 'DESC',
          'fields' => '*',
          //'perPage' => null,
          //'currentPage' => 0,
          'id' => -1,
          'search' => null,
          STATUS_COLUMN_NAME => null
        );
    }

    public function fetchFeed($params = null) {
        $sql = new Sql($this->adapter);
        $select = $sql->select()->from($this->table);

        $params['orderColumn'] = 'id';
        $params['orderDirection'] = 'DESC';

        $tableSchemaArray = TableSchema::getSchemaArray($this->table);
        $hasActiveColumn = $this->schemaHasActiveColumn($tableSchemaArray);
        $params = $this->applyDefaultEntriesSelectParams($params);

        $columns = array('id','identifier','action','table_name','row_id','user','datetime','type', 'data');
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

        foreach ($rowset as &$row) {
            $row['datetime'] .= ' UTC';
        }

        $countTotalWhere = new Where;
        $countTotalWhere
            ->isNull('parent_id')
            ->OR
            ->equalTo('type', 'FILES');
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

    public function recordLogin($userid) {
      $logData = array(
          'type'              => self::TYPE_LOGIN,
          'table_name'        => 'directus_users',
          'action'            => self::ACTION_LOGIN,
          'user'              => $userid,
          'datetime'          => gmdate('Y-m-d H:i:s'),
          'parent_id'         => null,
          'logged_ip'         =>$_SERVER['REMOTE_ADDR']
      );

      $insert = new Insert($this->getTable());
      $insert
        ->values($logData);

      $this->insertWith($insert);
    }

    public function recordMessage($data, $userId) {
      if(isset($data['response_to']) && $data['response_to'] > 0) {
        $action = "REPLY";
      } else {
        $action = "ADD";
      }

      $logData = array(
          'type'              => self::TYPE_MESSAGE,
          'table_name'        => 'directus_messages',
          'action'            => $action,
          'user'              => $userId,
          'datetime'          => gmdate('Y-m-d H:i:s'),
          'parent_id'         => null,
          'data'              => json_encode($data),
          'delta'             => "[]",
          'identifier'        => $data['subject'],
          'row_id'            => $data['id'],
          'logged_ip'         =>$_SERVER['REMOTE_ADDR']
      );

      $insert = new Insert($this->getTable());

      $insert
        ->values($logData);

      $this->insertWith($insert);
    }
}
