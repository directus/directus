<?php

namespace Directus\Database\TableGateway;

use Directus\Database\Object\Table;
use Directus\Database\TableSchema;
use Directus\Util\ArrayUtils;
use Zend\Db\Sql\Predicate;
use Zend\Db\Sql\Select;
use Zend\Db\Sql\Where;

class RelationalTableGatewayWithConditions extends RelationalTableGateway
{
    public function applyParamsToTableEntriesSelect(array $params, Select $select, Table $schema, $hasActiveColumn = false)
    {
        $tableName = $this->getTable();
        $this->processOrder($select, $params);
        $this->processLimit($select, $params);
        $this->processOffset($select, $params);

        if (ArrayUtils::has($params, 'filter')) {
            $this->processConditions($select, $params['filter']);
        }

        if (isset($params['group_by'])) {
            $select->group($tableName . '.' . $params['group_by']);
        }

        //If this is a relational order, than it is an array.
//        if (is_array($params['orderBy'])) {
//            $select->join(
//                ['jsort' => $params['orderBy']['junction_table']],
//                'jsort.' . $params['orderBy']['jkeyRight'] . ' = ' . $tableName . '.' . $this->primaryKeyFieldName,
//                [],
//                $select::JOIN_LEFT
//            );
//
//            $select->join(
//                ['rsort' => $params['orderBy']['related_table']],
//                'rsort.id = jsort.' . $params['orderBy']['jkeyLeft'],
//                [],
//                $select::JOIN_LEFT
//            );
//
//            $select->order('rsort.title', $params['orderDirection']);
//        }

        // Are we sorting on a relationship?
        foreach ($schema as $column) {
            if ($column['column_name'] != $params['orderBy']) {
                continue;
            }
            // Must have defined related_table
            if (!isset($column['relationship']) || !is_array($column['relationship']) || !isset($column['relationship']['related_table'])) {
                break;
            }
            // Must have defined visible_column
            if (!isset($column['options']) || !is_array($column['options']) || !isset($column['options']['visible_column'])) {
                break;
            }
            $relatedTable = $column['relationship']['related_table'];
            $visibleColumn = $column['options']['visible_column'];
            $keyLeft = $params['table_name'] . '.' . $params['orderBy'];
            // @todo it's wrong to assume PKs are "id" but this is currently endemic to directus6
            $keyRight = $relatedTable . '.id';
            $joinedSortColumn = $relatedTable . '.' . $visibleColumn;
            $select
                ->reset(Select::ORDER)
                ->join($relatedTable, $keyLeft . '=' . $keyRight, [], Select::JOIN_LEFT)
                ->order($joinedSortColumn . ' ' . $params['orderDirection']);
            break;
        }


        // Note: be sure to explicitly check for null, because the value may be
        // '0' or 0, which is meaningful.
        if (null !== $params['status'] && $hasActiveColumn) {
            $haystack = is_array($params['status'])
                ? $params['status']
                : explode(',', $params['status']);

            if (!isset($params['table_name']) || empty($params['table_name'])) {
                $tableName = $this->getTable();
            } else {
                $tableName = $params['table_name'];
            }

            $statusColumnName = implode($this->adapter->platform->getIdentifierSeparator(), [
                $this->table,
                STATUS_COLUMN_NAME
            ]);

            $select->where->in($statusColumnName, $haystack);
        }

        // Select only ids from the ids if provided
        if (array_key_exists('ids', $params)) {
            $entriesIds = array_filter(explode(',', $params['ids']), 'is_numeric');

            if (count($entriesIds) > 0) {
                $select->where->in($this->primaryKeyFieldName, $entriesIds);
            }
        }

        // Where
        if (isset($params[$this->primaryKeyFieldName]) && $params[$this->primaryKeyFieldName] != -1) {
            $select
                ->where
                ->equalTo($this->primaryKeyFieldName, $params[$this->primaryKeyFieldName]);
        }

        // very very rudimentary ability to supply where conditions to fetch...
        // at the moment, only 'equalTo' and 'between' are supported... also, the 'total' key returned
        // in the json does not reflect these filters...
        // -MG
        if (array_key_exists('where', $params)) {
            $outer = $select->where->nest;
            foreach ($params['where'] as $whereCond) {
                $type = $whereCond['type'];
                $column = $whereCond['column'];

                if ($type == 'equalTo') {
                    $val = $whereCond['val'];
                    if (is_array($val)) {
                        $where = $select->where->nest;
                        foreach ($val as $currentval) {
                            $where->equalTo($column, $currentval);
                            if ($currentval != end($val)) {
                                $where->or;
                            }
                        }
                        $where->unnest;
                    } else {
                        $outer->equalTo($column, $val);
                    }

                } else if ($type == 'between') {
                    $val1 = $whereCond['val1'];
                    $val2 = $whereCond['val2'];
                    $outer->between($column, $val1, $val2);
                }

            }
            $outer->unnest;
        }

        //@TODO: Make this better
        if (isset($params['adv_where'])) {
            $select->where($params['adv_where']);
        }

        if (isset($params['adv_search']) && !empty($params['adv_search'])) {
            $i = 0;
            foreach ($params['adv_search'] as $search_col) {
                $target = [];
                foreach ($schema as $col) {
                    if ($col['id'] == $search_col['id']) {
                        $target = $col;
                        break;
                    }
                }

                if (empty($target)) {
                    continue;
                }

                // TODO: fix this, it must be refactored
                if (isset($target['relationship']) && $target['relationship']['type'] == 'MANYTOMANY') {

                    $relatedTable = $target['relationship']['related_table'];
                    $relatedAliasName = $relatedTable . '_' . $i;

                    if ($target['relationship']['type'] == 'MANYTOMANY') {
                        $junctionTable = $target['relationship']['junction_table'];
                        $jkl = $target['relationship']['junction_key_left'];
                        $jkr = $target['relationship']['junction_key_right'];

                        $keyleft = $params['table_name'] . '.id';
                        $keyRight = $junctionTable . '.' . $jkl;

                        $jkeyleft = $junctionTable . '.' . $jkr;
                        $jkeyright = $relatedAliasName . '.id';


                        $select->join($junctionTable,
                            $keyleft . '=' . $keyRight,
                            [],
                            Select::JOIN_INNER);
                    } else {
                        $select->join([$relatedAliasName => $relatedTable],
                            $tableName . '.' . $target['column_name'] . ' = ' . $relatedAliasName . '.id',
                            [],
                            Select::JOIN_INNER);
                    }

                    $relatedTableMetadata = TableSchema::getSchemaArray($relatedTable);

                    if ($search_col['type'] == 'like') {
                        $select->join([$relatedAliasName => $relatedTable],
                            $jkeyleft . '=' . $jkeyright,
                            [],
                            Select::JOIN_INNER);

                        $search_col['value'] = '%' . $search_col['value'] . '%';
                        if (isset($target['options']['filter_column'])) {
                            $targetCol = $target['options']['filter_column'];
                        } else {
                            $targetCol = $target['options']['visible_column'];
                        }

                        foreach ($relatedTableMetadata as $col) {
                            if ($col['id'] == $targetCol) {
                                if ($col['type'] == 'VARCHAR' || $col['type'] == 'INT') {
                                    $where = $select->where->nest;
                                    $columnName = $this->adapter->platform->quoteIdentifier($col['column_name']);
                                    $columnName = $relatedAliasName . '.' . $columnName;
                                    $like = new Predicate\Expression('LOWER(' . $columnName . ') LIKE ?', $search_col['value']);
                                    $where->addPredicate($like, Predicate\Predicate::OP_OR);
                                    $where->unnest;
                                }
                            }
                        }
                    } else {
                        $select->where($jkeyleft . ' = ' . $this->adapter->platform->quoteValue($search_col['value']));
                    }
                } elseif (isset($target['relationship']) && $target['relationship']['type'] == 'MANYTOONE') {
                    $relatedTable = $target['relationship']['related_table'];

                    $keyRight = $this->getTable() . '.' . $target['relationship']['junction_key_right'];
                    $keyLeft = $relatedTable . '.id';
                    $filterColumn = $target['options']['visible_column'];
                    $joinedFilterColumn = $relatedTable . '.' . $filterColumn;

                    // do not let join this table twice
                    // TODO: do a extra checking in case it's being used twice
                    // and none for sorting
                    if ($target['column_name'] != $params['orderBy']) {
                        $select
                            ->join($relatedTable, $keyLeft . '=' . $keyRight, [], Select::JOIN_LEFT);
                    }

                    if ($search_col['type'] == 'like') {
                        $searchLike = '%' . $search_col['value'] . '%';
                        $spec = function (Where $where) use ($joinedFilterColumn, $searchLike) {
                            $where->like($joinedFilterColumn, $searchLike);
                        };
                        $select->where($spec);
                    } else {
                        $select->where($search_col['id'] . ' ' . $search_col['type'] . ' ' . $this->adapter->platform->quoteValue($search_col['value']));
                    }

                } else {
                    if ($target['type'] == 'DATETIME' && strpos($search_col['value'], ' ') == false) {
                        $select->where('date(' . $tableName . '.' . $search_col['id'] . ') = ' . $this->adapter->platform->quoteValue($search_col['value']));
                    } else {
                        if ($search_col['type'] == 'like') {
                            $select->where($tableName . '.' . $search_col['id'] . ' ' . $search_col['type'] . ' ' . $this->adapter->platform->quoteValue('%' . $search_col['value'] . '%'));
                        } else {
                            $select->where($tableName . '.' . $search_col['id'] . ' ' . $search_col['type'] . ' ' . $this->adapter->platform->quoteValue($search_col['value']));
                        }
                    }
                }
                $i++;
            }
        } else if (isset($params['search']) && !empty($params['search'])) {
            $params['search'] = '%' . $params['search'] . '%';
            $where = $select->where->nest;
            foreach ($schema as $col) {
                if ($col['type'] == 'VARCHAR' || $col['type'] == 'INT') {
                    $columnName = $this->adapter->platform->quoteIdentifier($col['column_name']);
                    $like = new Predicate\Expression('LOWER(' . $columnName . ') LIKE ?', strtolower($params['search']));
                    $where->addPredicate($like, Predicate\Predicate::OP_OR);
                }
            }
            $where->unnest;
        }
        return $select;
    }

    /**
     * Process Select Order
     *
     * @param $select
     * @param array $params
     */
    protected function processOrder(Select $select, array $params = [])
    {
        $orders = ArrayUtils::get($params, 'order', []);
        if (ArrayUtils::has($params, 'orderBy')) {
            $orders[] = [
                $params['orderBy'] => ArrayUtils::get($params, 'orderDirection', 'ASC')
            ];
        }

        $orders = [];
        foreach($params['order'] as $orderBy => $orderDirection) {
            $orders[] = sprintf('%s %s', $orderBy, $orderDirection);
        }

        if ($orders) {
            $select->order($orders);
        }
    }

    /**
     * Process Select Limit
     *
     * @param Select $select
     * @param array $params
     */
    protected function processLimit(Select $select, array $params = [])
    {
        $limit = ArrayUtils::get($params, 'limit', null);
        if ($limit !== null) {
            $select->limit($limit);
        }
    }

    /**
     * Process Select offset
     *
     * @param Select $select
     * @param array $params
     */
    protected function processOffset(Select $select, array $params = [])
    {
        $limit = ArrayUtils::get($params, 'limit', 200);
        $offset = $limit * ArrayUtils::get($params, 'offset', 0);
        $skip = ArrayUtils::get($params, 'skip', null);

        if ($skip !== null) {
            $offset = $skip;
        }

        if ($offset !== null) {
            $select->offset($offset);
        }
    }

    /**
     * Process Select Conditions
     *
     * @param Select $select
     * @param array $filters
     */
    protected function processConditions(Select $select, array $filters = [])
    {
        foreach($filters as $column => $condition) {
            $operator = key($condition);
            $value = current($condition);
            switch($operator) {
                case 'in':
                    // Filter entries that match one of these values separated by comma
                    // filter[column][in]=value1,value2
                    $this->proccessInExpression($select, $column, $value);
                    break;
            }
        }
    }

    /**
     * Process Select In Conditions
     *
     * @param Select $select
     * @param $column
     * @param $value
     */
    protected function proccessInExpression(Select $select, $column, $value)
    {
        if (!is_array($value)) {
            return;
        }

        if (is_string($value)) {
            $value = explode(',', $value);
        }

        $select->where->in($column, $value);
    }
}
