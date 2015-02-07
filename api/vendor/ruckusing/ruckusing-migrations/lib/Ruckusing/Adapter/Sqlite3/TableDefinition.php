<?php

/**
 * Ruckusing
 *
 * @category  Ruckusing
 * @package   Ruckusing_Adapter
 * @subpackage   Sqlite3
 * @author    Piotr Olaszewski <piotroo89 % gmail dot com>
 * @author    Andrzej Oczkowicz <andrzejoczkowicz % gmail . com>
 * @link      https://github.com/ruckus/ruckusing-migrations
 */

/**
 * Ruckusing_Adapter_Sqlite3_TableDefinition
 *
 * @category Ruckusing
 * @package  Ruckusing_Adapter
 * @subpackage   Sqlite3
 * @author    Piotr Olaszewski <piotroo89 % gmail dot com>
 * @author    Andrzej Oczkowicz <andrzejoczkowicz % gmail . com>
 * @link      https://github.com/ruckus/ruckusing-migrations
 */
class Ruckusing_Adapter_Sqlite3_TableDefinition extends Ruckusing_Adapter_TableDefinition
{
    /**
     * @var Ruckusing_Adapter_Sqlite3_Base
     */
    private $_adapter;
    /**
     * @var
     */
    private $_name;
    /**
     * @var array
     */
    private $_options;
    /**
     * @var string
     */
    private $_sql = "";
    /**
     * @var bool
     */
    private $_initialized = false;
    /**
     * @var array
     */
    private $_columns = array();
    /**
     * @var Ruckusing_Adapter_TableDefinition
     */
    private $_table_def;
    /**
     * @var array
     */
    private $_primary_keys = array();
    /**
     * @var bool
     */
    private $_auto_generate_id = true;

    /**
     * @param Ruckusing_Adapter_Base $adapter
     * @param $name
     * @param array $options
     * @throws Ruckusing_Exception
     */
    public function __construct($adapter, $name, $options = array())
    {
        //sanity check
        if (!($adapter instanceof Ruckusing_Adapter_Sqlite3_Base)) {
            throw new Ruckusing_Exception("Invalid Postgres Adapter instance.", Ruckusing_Exception::INVALID_ADAPTER);
        }
        if (!$name) {
            throw new Ruckusing_Exception("Invalid 'name' parameter", Ruckusing_Exception::INVALID_ARGUMENT);
        }

        $this->_adapter = $adapter;
        $this->_name = $name;
        $this->_options = $options;
        $this->init_sql($name, $options);
        $this->_table_def = new Ruckusing_Adapter_TableDefinition($this->_adapter, $this->_options);

        if (array_key_exists('id', $options)) {
            if (is_bool($options['id']) && $options['id'] == false) {
                $this->_auto_generate_id = false;
            }
            //if its a string then we want to auto-generate an integer-based primary key with this name
            if (is_string($options['id'])) {
                $this->_auto_generate_id = true;
                $this->_primary_keys[] = $options['id'];
            }
        }
    }

    /**
     * @param $name
     * @param $options
     * @throws Exception
     * @throws Ruckusing_Exception
     */
    private function init_sql($name, $options)
    {
        //are we forcing table creation? If so, drop it first
        if (array_key_exists('force', $options) && $options['force']) {
            try {
                $this->_adapter->drop_table($name);
            } catch (Ruckusing_Exception $e) {
                if ($e->getCode() != Ruckusing_Exception::MISSING_TABLE) {
                    throw $e;
                }
                //do nothing
            }
        }
        $temp = "";
        $create_sql = sprintf("CREATE%s TABLE ", $temp);
        $create_sql .= sprintf("%s (\n", $this->_adapter->identifier($name));
        $this->_sql .= $create_sql;
        $this->_initialized = true;
    }

    /**
     * @param $column_name
     * @param $type
     * @param array $options
     */
    public function column($column_name, $type, $options = array())
    {
        //if there is already a column by the same name then silently fail and continue
        if ($this->_table_def->included($column_name)) {
            return;
        }

        $column_options = array();

        if (array_key_exists('primary_key', $options)) {
            if ($options['primary_key'] == true) {
                $this->_primary_keys[] = $column_name;
            }
        }

        $column_options = array_merge($column_options, $options);
        $column = new Ruckusing_Adapter_ColumnDefinition($this->_adapter, $column_name, $type, $column_options);

        $this->_columns[] = $column;
    }

    /**
     * @param bool $wants_sql
     * @return bool|string
     * @throws Ruckusing_Exception
     */
    public function finish($wants_sql = false)
    {
        if (!$this->_initialized) {
            throw new Ruckusing_Exception(sprintf("Table Definition: '%s' has not been initialized", $this->_name), Ruckusing_Exception::INVALID_TABLE_DEFINITION);
        }

        if (is_array($this->_options) && array_key_exists('options', $this->_options)) {
            $opt_str = $this->_options['options'];
        } else {
            $opt_str = null;
        }

        $close_sql = sprintf(") %s;", $opt_str);
        $create_table_sql = $this->_sql;

        if ($this->_auto_generate_id === true) {
            $this->_primary_keys[] = 'id';
            $primary_id = new Ruckusing_Adapter_ColumnDefinition($this->_adapter, 'id', 'primary_key');
            $create_table_sql .= $primary_id->to_sql() . ",\n";
        }

        $create_table_sql .= $this->columns_to_str();
        $create_table_sql .= $this->keys() . $close_sql;

        if ($wants_sql) {
            return $create_table_sql;
        } else {
            return $this->_adapter->execute_ddl($create_table_sql);
        }
    }

    /**
     * @return string
     */
    private function columns_to_str()
    {
        $fields = array();
        $len = count($this->_columns);
        for ($i = 0; $i < $len; $i++) {
            $c = $this->_columns[$i];
            $fields[] = $c->__toString();
        }

        return join(",\n", $fields);
    }

    /**
     * @return string
     */
    private function keys()
    {
        if (count($this->_primary_keys) > 0) {
            $lead = ' PRIMARY KEY (';
            $quoted = array();
            foreach ($this->_primary_keys as $key) {
                $quoted[] = sprintf("%s", $this->_adapter->identifier($key));
            }
            $primary_key_sql = ",\n" . $lead . implode(",", $quoted) . ")";

            return ($primary_key_sql);
        } else {
            return '';
        }
    }
}