<?php

namespace Directus\Database\TableGateway;

use Directus\Database\Query\Builder;
use Directus\Database\TableSchema;
use Directus\Permissions\Acl;
use Directus\Util\ArrayUtils;
use Directus\Util\DateUtils;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Sql\Expression;
use Zend\Db\Sql\Insert;
use Zend\Db\Sql\Predicate\In;
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

    public $primaryKeyFieldName = 'id';

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

    /**
     * DirectusActivityTableGateway constructor.
     *
     * @param AdapterInterface $adapter
     * @param Acl $acl
     */
    public function __construct(AdapterInterface $adapter, $acl = null)
    {
        parent::__construct(self::$_tableName, $adapter, $acl);
    }

    public function fetchFeed($params = null)
    {
        $params['order'] = ['id' => 'DESC'];
        $params = $this->applyDefaultEntriesSelectParams($params);
        $builder = new Builder($this->getAdapter());
        $builder->from($this->getTable());

        // @TODO: Only select the fields not on the currently authenticated user group's read field blacklist
        $columns = ['id', 'identifier', 'action', 'table_name', 'row_id', 'user', 'datetime', 'type', 'data', 'logged_ip'];
        $builder->columns($columns);

        $tableSchema = TableSchema::getTableSchema($this->table);
        $hasActiveColumn = $tableSchema->hasStatusColumn();

        $builder = $this->applyParamsToTableEntriesSelect($params, $builder, $tableSchema, $hasActiveColumn);

        $select = $builder->buildSelect();

        $select
            ->where
            ->nest
            ->isNull('parent_id')
            ->OR
            ->equalTo('type', 'FILES')
            ->unnest;

        $rowset = $this->selectWith($select);
        $rowset = $rowset->toArray();

        $countTotalWhere = new Where;
        $countTotalWhere
            ->isNull('parent_id')
            ->OR
            ->equalTo('type', 'FILES');

        return $this->loadMetadata($this->parseRecord($rowset));
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

        return $this->loadMetadata($this->parseRecord($result));
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
            'logged_ip' => get_request_ip(),
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

    /**
     * Get the last update date from a list of row ids in the given table
     *
     * @param $table
     * @param $ids
     *
     * @return array|null
     */
    public function getLastUpdated($table, $ids)
    {
        if (!is_array($ids)) {
            $ids = [$ids];
        }

        $sql = new Sql($this->adapter);
        $select = $sql->select($this->getTable());

        $select->columns([
            'row_id',
            'user',
            'datetime' => new Expression('MAX(datetime)')
        ]);

        $select->where([
            'table_name' => $table,
            'type' => 'ENTRY',
            new In('action', ['UPDATE', 'ADD']),
            new In('row_id', $ids)
        ]);

        $select->group(['row_id', 'user']);
        $select->order(['datetime' => 'DESC']);

        $statement = $this->sql->prepareStatementForSqlObject($select);
        $result = iterator_to_array($statement->execute());

        return ['data' => $this->parseRecord($result)];
    }

    public function getMetadata($table, $id)
    {
        $sql = new Sql($this->adapter);
        $select = $sql->select($this->getTable());

        $select->columns([
            'action',
            'user',
            'datetime' => new Expression('MAX(datetime)')
        ]);

        $on = 'directus_users.id = directus_activity.user';
        $select->join('directus_users', $on, []);

        $select->where([
            'table_name' => $table,
            'row_id' => $id,
            'type' => $table === 'directus_files' ? static::TYPE_FILES : static::TYPE_ENTRY,
            new In('action', ['ADD', 'UPDATE'])
        ]);

        $select->group([
            'action',
            'user'
        ]);

        $select->limit(2);

        $statement = $this->sql->prepareStatementForSqlObject($select);
        $result = iterator_to_array($statement->execute());
        $result = $this->parseRecord($result);

        $data = [
            'created_on' => null,
            'created_by' => null,
            'updated_on' => null,
            'updated_by' => null
        ];

        foreach ($result as $row) {
            switch (ArrayUtils::get($row, 'action')) {
                case static::ACTION_ADD:
                    $data['created_by'] = $row['user'];
                    $data['created_on'] = $row['datetime'];
                    break;
                case static::ACTION_UPDATE:
                    $data['updated_by'] = $row['user'];
                    $data['updated_on'] = $row['datetime'];
                    break;
            }
        }

        if (!$data['updated_by'] && !$data['updated_on']) {
            $data['updated_on'] = $data['created_on'];
            $data['updated_by'] = $data['created_by'];
        }

        return $data;
    }
}
