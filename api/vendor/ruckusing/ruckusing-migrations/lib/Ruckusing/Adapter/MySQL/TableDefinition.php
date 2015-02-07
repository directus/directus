<?php

/**
 * Ruckusing
 *
 * @category  Ruckusing
 * @package   Ruckusing_Adapter
 * @subpackage   MySQL
 * @author    Cody Caughlan <codycaughlan % gmail . com>
 * @link      https://github.com/ruckus/ruckusing-migrations
 */

/**
 * Ruckusing_Adapter_MySQL_TableDefinition
 *
 * @category Ruckusing
 * @package  Ruckusing_Adapter
 * @subpackage   MySQL
 * @author   Cody Caughlan <codycaughlan % gmail . com>
 * @link      https://github.com/ruckus/ruckusing-migrations
 */
class Ruckusing_Adapter_MySQL_TableDefinition
{
    /**
     * adapter MySQL
     *
     * @var Ruckusing_Adapter_Mysql_Base
     */
    private $_adapter;

    /**
     * Name
     *
     * @var string
     */
    private $_name;

    /**
     * options
     *
     * @var array
     */
    private $_options;

    /**
     * sql
     *
     * @var string
     */
    private $_sql = "";

    /**
     * initialized
     *
     * @var boolean
     */
    private $_initialized = false;

    /**
     * Columns
     *
     * @var array
     */
    private $_columns = array();

    /**
     * Table definition
     *
     * @var array
     */
    private $_table_def;

    /**
     * primary keys
     *
     * @var array
     */
    private $_primary_keys = array();

    /**
     * auto generate id
     *
     * @var boolean
     */
    private $_auto_generate_id = true;

    /**
     * Creates an instance of Ruckusing_Adapters_MySQL_Adapter
     *
     * @param Ruckusing_Adapter_MySQL_Base $adapter the current adapter
     * @param string $name the table name
     * @param array $options the options
     *
     * @throws Ruckusing_Exception
     * @return Ruckusing_Adapter_MySQL_TableDefinition
     */
    public function __construct($adapter, $name, $options = array())
    {
        //sanity check
        if (!($adapter instanceof Ruckusing_Adapter_MySQL_Base)) {
            throw new Ruckusing_Exception(
                    "Invalid MySQL Adapter instance.",
                    Ruckusing_Exception::INVALID_ADAPTER
            );
        }
        if (!$name) {
            throw new Ruckusing_Exception(
                    "Invalid 'name' parameter",
                    Ruckusing_Exception::INVALID_ARGUMENT
            );
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
            //if its a string then we want to auto-generate an integer-based
            //primary key with this name
            if (is_string($options['id'])) {
                $this->_auto_generate_id = true;
                $this->_primary_keys[] = $options['id'];
            }
        }
    }

    /*
     public function primary_key($name, $auto_increment)
     {
    $options = array('auto_increment' => $auto_increment);
    $this->column($name, "primary_key", $options);
    }
    */

    /**
     * Create a column
     *
     * @param string $column_name the column name
     * @param string $type        the column type
     * @param array  $options
     */
    public function column($column_name, $type, $options = array())
    {
        //if there is already a column by the same name then silently fail
        //and continue
        if ($this->_table_def->included($column_name) == true) {
            return;
        }

        $column_options = array();

        if (array_key_exists('primary_key', $options)) {
            if ($options['primary_key'] == true) {
                $this->_primary_keys[] = $column_name;
            }
        }

        if (array_key_exists('auto_increment', $options)) {
            if ($options['auto_increment'] == true) {
                $column_options['auto_increment'] = true;
            }
        }
        $column_options = array_merge($column_options, $options);
        $column = new Ruckusing_Adapter_ColumnDefinition($this->_adapter, $column_name, $type, $column_options);

        $this->_columns[] = $column;
    }//column

    /**
     * Get all primary keys
     *
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

            return($primary_key_sql);
        } else {
            return '';
        }
    }

    /**
     * Table definition
     *
     * @param boolean $wants_sql
     *
     * @throws Ruckusing_Exception
     * @return boolean | string
     */
    public function finish($wants_sql = false)
    {
        if ($this->_initialized == false) {
            throw new Ruckusing_Exception(
                    sprintf("Table Definition: '%s' has not been initialized", $this->_name),
                    Ruckusing_Exception::INVALID_TABLE_DEFINITION
            );
        }
        if (is_array($this->_options) && array_key_exists('options', $this->_options)) {
            $opt_str = $this->_options['options'];
        } else {
            $opt_str = null;
        }
        if(isset($this->_adapter->db_info['charset'])){
            $opt_str .= " DEFAULT CHARSET=".$this->_adapter->db_info['charset'];
        } else {
            $opt_str .= " DEFAULT CHARSET=utf8";
        }

        $close_sql = sprintf(") %s;",$opt_str);
        $create_table_sql = $this->_sql;

        if ($this->_auto_generate_id === true) {
            $this->_primary_keys[] = 'id';
            $primary_id = new Ruckusing_Adapter_ColumnDefinition($this->_adapter, 'id', 'integer',
                    array('unsigned' => true, 'null' => false, 'auto_increment' => true));

            $create_table_sql .= $primary_id->to_sql() . ",\n";
        }

        $create_table_sql .= $this->columns_to_str();
        $create_table_sql .= $this->keys() . $close_sql;

        if ($wants_sql) {
            return $create_table_sql;
        } else {
            return $this->_adapter->execute_ddl($create_table_sql);
        }
    }//finish

    /**
     * get all columns
     *
     * @return string
     */
    private function columns_to_str()
    {
        $str = "";
        $fields = array();
        $len = count($this->_columns);
        for ($i = 0; $i < $len; $i++) {
            $c = $this->_columns[$i];
            $fields[] = $c->__toString();
        }

        return join(",\n", $fields);
    }

    /**
     * Init create sql
     *
     * @param string $name
     * @param array $options
     * @throws Exception
     * @throws Ruckusing_Exception
     */
    private function init_sql($name, $options)
    {
        //are we forcing table creation? If so, drop it first
        if (array_key_exists('force', $options) && $options['force'] == true) {
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
        if (array_key_exists('temporary', $options)) {
            $temp = " TEMPORARY";
        }
        $create_sql = sprintf("CREATE%s TABLE ", $temp);
        $create_sql .= sprintf("%s (\n", $this->_adapter->identifier($name));
        $this->_sql .= $create_sql;
        $this->_initialized = true;
    }
}
