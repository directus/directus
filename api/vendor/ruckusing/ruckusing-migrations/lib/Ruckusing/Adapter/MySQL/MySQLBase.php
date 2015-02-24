<?php

namespace Ruckusing\Adapter\MySQL;

use Ruckusing\Adapter\AdapterBase as Ruckusing_Adapter_Base;
use Ruckusing\Adapter\AdapterInterface as Ruckusing_Adapter_Interface;
use Ruckusing\Adapter\MySQL\MySQLTableDefinition as Ruckusing_Adapter_MySQL_TableDefinition;
use Ruckusing\Util\Naming as Ruckusing_Util_Naming;
use Ruckusing\RuckusingException as Ruckusing_Exception;
use \mysqli;
/**
 * Ruckusing
 *
 * @category  Ruckusing
 * @package   Ruckusing_Adapter
 * @subpackage MySQL
 * @author    Cody Caughlan <codycaughlan % gmail . com>
 * @link      https://github.com/ruckus/ruckusing-migrations
 */

// max length of an identifier like a column or index name
define('MYSQL_MAX_IDENTIFIER_LENGTH', 64);

/**
 * Ruckusing_Adapter_MySQL_Base
 *
 * @category Ruckusing
 * @package  Ruckusing_Adapter
 * @subpackage Mysql
 * @author   Cody Caughlan <codycaughlan % gmail . com>
 * @link      https://github.com/ruckus/ruckusing-migrations
 */
class MySQLBase extends Ruckusing_Adapter_Base implements Ruckusing_Adapter_Interface
{
    /**
     * Name of adapter
     *
     * @var string
     */
    private $_name = "MySQL";

    /**
     * tables
     *
     * @var array
     */
    private $_tables = array();

    /**
     * tables_loaded
     *
     * @var boolean
     */
    private $_tables_loaded = false;

    /**
     * version
     *
     * @var string
     */
    private $_version = '1.0';

    /**
     * Indicate if is in transaction
     *
     * @var boolean
     */
    private $_in_trx = false;

    /**
     * Creates an instance of Ruckusing_Adapter_MySQL_Base
     *
     * @param array                 $dsn    The current dsn
     * @param Ruckusing_Util_Logger $logger the current logger
     *
     * @return Ruckusing_Adapter_MySQL_Base
     */
    public function __construct($dsn, $logger)
    {
        parent::__construct($dsn);
        $this->connect($dsn);
        $this->set_logger($logger);
    }

    /**
     * Get the current db name
     *
     * @return string
     */
    public function get_database_name()
    {
        return($this->db_info['database']);
    }

    /**
     * Check support for migrations
     *
     * @return boolean
     */
    public function supports_migrations()
    {
        return true;
    }

    /**
     * Get the column native types
     *
     * @return array
     */
    public function native_database_types()
    {
        $types = array(
                'primary_key'   => array('name' => 'integer', 'limit' => 11, 'null' => false),
                'string'        => array('name' => "varchar", 'limit' => 255),
                'text'          => array('name' => "text"),
                'tinytext'      => array('name' => "tinytext"),
                'mediumtext'    => array('name' => 'mediumtext'),
                'integer'       => array('name' => "int", 'limit' => 11),
                'tinyinteger'  	=> array('name' => "tinyint"),
                'smallinteger'  => array('name' => "smallint"),
                'mediuminteger'	=> array('name' => "mediumint"),
                'biginteger'    => array('name' => "bigint"),
                'float'         => array('name' => "float"),
                'decimal'       => array('name' => "decimal", 'scale' => 0, 'precision' => 10),
                'datetime'      => array('name' => "datetime"),
                'timestamp'     => array('name' => "timestamp"),
                'time'          => array('name' => "time"),
                'date'          => array('name' => "date"),
                'binary'        => array('name' => "blob"),
		            'tinybinary'    => array('name' => "tinyblob"),
		            'mediumbinary'  => array('name' => "mediumblob"),
		            'longbinary'    => array('name' => "longblob"),
                'boolean'       => array('name' => "tinyint", 'limit' => 1),
                'enum'          => array('name' => "enum", 'values' => array()),
                'uuid'          => array('name' => "char", 'limit' => 36),
                'char'          => array('name' => "char"),
        );

        return $types;
    }

    /**
     * Create the schema table, if necessary
     */
    public function create_schema_version_table()
    {
        if (!$this->has_table(RUCKUSING_TS_SCHEMA_TBL_NAME)) {
            $t = $this->create_table(RUCKUSING_TS_SCHEMA_TBL_NAME, array('id' => false));
            $t->column('version', 'string');
            $t->finish();
            $this->add_index(RUCKUSING_TS_SCHEMA_TBL_NAME, 'version', array('unique' => true));
        }
    }

    /**
     * Start Transaction
     */
    public function start_transaction()
    {
        if ($this->inTransaction() === false) {
            $this->beginTransaction();
        }
    }

    /**
     * Commit Transaction
     */
    public function commit_transaction()
    {
        if ($this->inTransaction()) {
            $this->commit();
        }
    }

    /**
     * Rollback Transaction
     */
    public function rollback_transaction()
    {
        if ($this->inTransaction()) {
            $this->rollback();
        }
    }

    /**
     * Quote a table name string
     *
     * @param string $str table name
     * @return string
     */
    public function quote_table($str)
    {
        return "`" . $str . "`";
    }

    /**
     * Column definition
     *
     * @param string $column_name the column name
     * @param string $type        the type of the column
     * @param array  $options     column options
     *
     * @return string
     */
    public function column_definition($column_name, $type, $options = null)
    {
        $col = new Ruckusing_Adapter_ColumnDefinition($this, $column_name, $type, $options);

        return $col->__toString();
    }

    //-------- DATABASE LEVEL OPERATIONS
    /**
    * Check if a db exists
    *
    * @param string $db the db name
    *
    * @return boolean
    */
    public function database_exists($db)
    {
        $ddl = "SHOW DATABASES";
        $result = $this->select_all($ddl);
        if (count($result) == 0) {
            return false;
        }
        foreach ($result as $dbrow) {
            if ($dbrow['Database'] == $db) {
                return true;
            }
        }

        return false;
    }

    /**
     * Create a database
     *
     * @param string $db the db name
     *
     * @return boolean
     */
    public function create_database($db)
    {
        if ($this->database_exists($db)) {
            return false;
        }
        $ddl = sprintf("CREATE DATABASE %s", $this->identifier($db));
        $result = $this->query($ddl);

        return($result === true);
    }

    /**
     * Drop a database
     *
     * @param string $db the db name
     *
     * @return boolean
     */
    public function drop_database($db)
    {
        if (!$this->database_exists($db)) {
            return false;
        }
        $ddl = sprintf("DROP DATABASE IF EXISTS %s", $this->identifier($db));
        $result = $this->query($ddl);

        return ($result === true);
    }

    /**
     * Dump the complete schema of the DB. This is really just all of the
     * CREATE TABLE statements for all of the tables in the DB.
     * NOTE: this does NOT include any INSERT statements or the actual data
     * (that is, this method is NOT a replacement for mysqldump)
     *
     * @param string $output_file the filepath to output to
     *
     * @return int|FALSE
     */
    public function schema($output_file)
    {
        $final = "";
        $views = '';
        $this->load_tables(true);
        foreach ($this->_tables as $tbl => $idx) {

            if ($tbl == 'schema_info') {
                continue;
            }

            $stmt = sprintf("SHOW CREATE TABLE %s", $this->identifier($tbl));
            $result = $this->query($stmt);

            if (is_array($result) && count($result) == 1) {
                $row = $result[0];
                if (count($row) == 2) {
                    if (isset($row['Create Table'])) {
                        $final .= $row['Create Table'] . ";\n\n";
                    } elseif (isset($row['Create View'])) {
                        $views .= $row['Create View'] . ";\n\n";
                    }
                }
            }
        }
        $data = $final.$views;

        return file_put_contents($output_file, $data, LOCK_EX);
    }

    /**
     * Check if a table exists
     *
     * @param string  $tbl           the table name
     * @param boolean $reload_tables reload table or not
     *
     * @return boolean
     */
    public function table_exists($tbl, $reload_tables = false)
    {
        $this->load_tables($reload_tables);

        return array_key_exists($tbl, $this->_tables);
    }

    /**
     * Wrapper to execute a query
     *
     * @param string $query query to run
     *
     * @return boolean
     */
    public function execute($query)
    {
        return $this->query($query);
    }

    /**
     * Execute a query
     *
     * @param string $query query to run
     *
     * @throws Ruckusing_Exception
     * @return boolean
     */
    public function query($query)
    {
        $this->logger->log($query);
        $query_type = $this->determine_query_type($query);
        $data = array();
        if ($query_type == SQL_SELECT || $query_type == SQL_SHOW) {
            $res = $this->conn->query($query);
            if ($this->isError($res)) {
                throw new Ruckusing_Exception(
                        sprintf("Error executing 'query' with:\n%s\n\nReason: %s\n\n", $query, $this->conn->error),
                        Ruckusing_Exception::QUERY_ERROR
                );
            }
            while ($row = $res->fetch_assoc()) {
                $data[] = $row;
            }

            return $data;

        } else {
            // INSERT, DELETE, etc...
            $res = $this->conn->query($query);
            if ($this->isError($res)) {
                throw new Ruckusing_Exception(
                        sprintf("Error executing 'query' with:\n%s\n\nReason: %s\n\n", $query, $this->conn->error),
                        Ruckusing_Exception::QUERY_ERROR
                );
            }

            if ($query_type == SQL_INSERT) {
                return $this->conn->insert_id;
            }

            return true;
        }
    }

    /**
     * Select one
     *
     * @param string $query query to run
     *
     * @throws Ruckusing_Exception
     * @return array
     */
    public function select_one($query)
    {
        $this->logger->log($query);
        $query_type = $this->determine_query_type($query);
        if ($query_type == SQL_SELECT || $query_type == SQL_SHOW) {
            $res = $this->conn->query($query);
            if ($this->isError($res)) {
                throw new Ruckusing_Exception(
                        sprintf("Error executing 'query' with:\n%s\n\nReason: %s\n\n", $query, $this->conn->error),
                        Ruckusing_Exception::QUERY_ERROR
                );
            }

            return $res->fetch_assoc();
        } else {
            throw new Ruckusing_Exception(
                    "Query for select_one() is not one of SELECT or SHOW: $query",
                    Ruckusing_Exception::QUERY_ERROR
            );
        }
    }

    /**
     * Select all
     *
     * @param string $query query to run
     *
     * @return array
     */
    public function select_all($query)
    {
        return $this->query($query);
    }

    /**
     * Use this method for non-SELECT queries
     * Or anything where you dont necessarily expect a result string, e.g. DROPs, CREATEs, etc.
     *
     * @param string $ddl query to run
     *
     * @return boolean
     */
    public function execute_ddl($ddl)
    {
        $result = $this->query($ddl);

        return true;

    }

    /**
     * Drop table
     *
     * @param string $tbl the table name
     *
     * @return boolean
     */
    public function drop_table($tbl)
    {
        $ddl = sprintf("DROP TABLE IF EXISTS %s", $this->identifier($tbl));
        $result = $this->query($ddl);

        return true;
    }

    /**
     * Create table
     *
     * @param string $table_name the table name
     * @param array $options the options
     * @return bool|Ruckusing_Adapter_MySQL_TableDefinition
     */
    public function create_table($table_name, $options = array())
    {
        return new Ruckusing_Adapter_MySQL_TableDefinition($this, $table_name, $options);
    }

    /**
     * Escape a string for mysql
     *
     * @param string $str the string
     *
     * @return string
     */
    public function quote_string($str)
    {
        return $this->conn->real_escape_string($str);
    }

    /**
     * Quote a string
     *
     * @param string $str the string
     *
     * @return string
     */
    public function identifier($str)
    {
        return "`" . $str . "`";
    }

    /**
     * Quote a string
     *
     * @param string $value  the string
     * @param string $column the column
     *
     * @return string
     */
    public function quote($value, $column = null)
    {
        return $this->quote_string($value);
    }

    /**
     * Rename a table
     *
     * @param string $name the current table name
     * @param string $new_name the new table name
     *
     * @throws Ruckusing_Exception
     * @return boolean
     */
    public function rename_table($name, $new_name)
    {
        if (empty($name)) {
            throw new Ruckusing_Exception(
                    "Missing original column name parameter",
                    Ruckusing_Exception::INVALID_ARGUMENT
            );
        }
        if (empty($new_name)) {
            throw new Ruckusing_Exception(
                    "Missing new column name parameter",
                    Ruckusing_Exception::INVALID_ARGUMENT
            );
        }
        $sql = sprintf("RENAME TABLE %s TO %s", $this->identifier($name), $this->identifier($new_name));

        return $this->execute_ddl($sql);
    }//create_table

    /**
     * Add a column
     *
     * @param string $table_name the table name
     * @param string $column_name the column name
     * @param string $type the column type
     * @param array $options column options
     *
     * @throws Ruckusing_Exception
     * @return boolean
     */
    public function add_column($table_name, $column_name, $type, $options = array())
    {
        if (empty($table_name)) {
            throw new Ruckusing_Exception(
                    "Missing table name parameter",
                    Ruckusing_Exception::INVALID_ARGUMENT
            );
        }
        if (empty($column_name)) {
            throw new Ruckusing_Exception(
                    "Missing column name parameter",
                    Ruckusing_Exception::INVALID_ARGUMENT
            );
        }
        if (empty($type)) {
            throw new Ruckusing_Exception(
                    "Missing type parameter",
                    Ruckusing_Exception::INVALID_ARGUMENT
            );
        }
        //default types
        if (!array_key_exists('limit', $options)) {
            $options['limit'] = null;
        }
        if (!array_key_exists('precision', $options)) {
            $options['precision'] = null;
        }
        if (!array_key_exists('scale', $options)) {
            $options['scale'] = null;
        }
        $sql = sprintf("ALTER TABLE %s ADD `%s` %s", $this->identifier($table_name), $column_name, $this->type_to_sql($type,$options));
        $sql .= $this->add_column_options($type, $options);

        return $this->execute_ddl($sql);
    }//add_column

    /**
     * Drop a column
     *
     * @param string $table_name  the table name
     * @param string $column_name the column name
     *
     * @return boolean
     */
    public function remove_column($table_name, $column_name)
    {
        $sql = sprintf("ALTER TABLE %s DROP COLUMN %s", $this->identifier($table_name), $this->identifier($column_name));

        return $this->execute_ddl($sql);
    }//remove_column

    /**
     * Rename a column
     *
     * @param string $table_name the table name
     * @param string $column_name the column name
     * @param string $new_column_name the new column name
     *
     * @throws Ruckusing_Exception
     * @return boolean
     */
    public function rename_column($table_name, $column_name, $new_column_name)
    {
        if (empty($table_name)) {
            throw new Ruckusing_Exception(
                    "Missing table name parameter",
                    Ruckusing_Exception::INVALID_ARGUMENT
            );
        }
        if (empty($column_name)) {
            throw new Ruckusing_Exception(
                    "Missing original column name parameter",
                    Ruckusing_Exception::INVALID_ARGUMENT
            );
        }
        if (empty($new_column_name)) {
            throw new Ruckusing_Exception(
                    "Missing new column name parameter",
                    Ruckusing_Exception::INVALID_ARGUMENT
            );
        }
        $column_info = $this->column_info($table_name, $column_name);
        $current_type = $column_info['type'];
        $sql =  sprintf("ALTER TABLE %s CHANGE %s %s %s",
                $this->identifier($table_name),
                $this->identifier($column_name),
                $this->identifier($new_column_name), $current_type);
        
        $sql .= $this->add_column_options($current_type, $column_info);

        return $this->execute_ddl($sql);
    }//rename_column

    /**
     * Change a column
     *
     * @param string $table_name the table name
     * @param string $column_name the column name
     * @param string $type the column type
     * @param array $options column options
     *
     * @throws Ruckusing_Exception
     * @return boolean
     */
    public function change_column($table_name, $column_name, $type, $options = array())
    {
        if (empty($table_name)) {
            throw new Ruckusing_Exception(
                    "Missing table name parameter",
                    Ruckusing_Exception::INVALID_ARGUMENT
            );
        }
        if (empty($column_name)) {
            throw new Ruckusing_Exception(
                    "Missing original column name parameter",
                    Ruckusing_Exception::INVALID_ARGUMENT
            );
        }
        if (empty($type)) {
            throw new Ruckusing_Exception(
                    "Missing type parameter",
                    Ruckusing_Exception::INVALID_ARGUMENT
            );
        }
        $column_info = $this->column_info($table_name, $column_name);
        //default types
        if (!array_key_exists('limit', $options)) {
            $options['limit'] = null;
        }
        if (!array_key_exists('precision', $options)) {
            $options['precision'] = null;
        }
        if (!array_key_exists('scale', $options)) {
            $options['scale'] = null;
        }
        $sql = sprintf("ALTER TABLE `%s` CHANGE `%s` `%s` %s", $table_name, $column_name, $column_name,  $this->type_to_sql($type,$options));
        $sql .= $this->add_column_options($type, $options);

        return $this->execute_ddl($sql);
    }//change_column

    /**
     * Get a column info
     *
     * @param string $table the table name
     * @param string $column the column name
     *
     * @throws Ruckusing_Exception
     * @return array
     */
    public function column_info($table, $column)
    {
        if (empty($table)) {
            throw new Ruckusing_Exception(
                    "Missing table name parameter",
                    Ruckusing_Exception::INVALID_ARGUMENT
            );
        }
        if (empty($column)) {
            throw new Ruckusing_Exception(
                    "Missing original column name parameter",
                    Ruckusing_Exception::INVALID_ARGUMENT
            );
        }
        try {
            $sql = sprintf("SHOW FULL COLUMNS FROM %s LIKE '%s'", $this->identifier($table), $column);
            $result = $this->select_one($sql);
            if (is_array($result)) {
                //lowercase key names
                $result = array_change_key_case($result, CASE_LOWER);
            }

            return $result;
        } catch (Exception $e) {
            return null;
        }
    }

    /**
     * Add an index
     *
     * @param string $table_name the table name
     * @param string $column_name the column name
     * @param array $options index options
     *
     * @throws Ruckusing_Exception
     * @return boolean
     */
    public function add_index($table_name, $column_name, $options = array())
    {
        if (empty($table_name)) {
            throw new Ruckusing_Exception(
                    "Missing table name parameter",
                    Ruckusing_Exception::INVALID_ARGUMENT
            );
        }
        if (empty($column_name)) {
            throw new Ruckusing_Exception(
                    "Missing column name parameter",
                    Ruckusing_Exception::INVALID_ARGUMENT
            );
        }
        //unique index?
        if (is_array($options) && array_key_exists('unique', $options) && $options['unique'] === true) {
            $unique = true;
        } else {
            $unique = false;
        }
        //did the user specify an index name?
        if (is_array($options) && array_key_exists('name', $options)) {
            $index_name = $options['name'];
        } else {
            $index_name = Ruckusing_Util_Naming::index_name($table_name, $column_name);
        }

        if (strlen($index_name) > MYSQL_MAX_IDENTIFIER_LENGTH) {
            $msg = "The auto-generated index name is too long for MySQL (max is 64 chars). ";
            $msg .= "Considering using 'name' option parameter to specify a custom name for this index.";
            $msg .= " Note: you will also need to specify";
            $msg .= " this custom name in a drop_index() - if you have one.";
            throw new Ruckusing_Exception($msg, Ruckusing_Exception::INVALID_INDEX_NAME);
        }
        if (!is_array($column_name)) {
            $column_names = array($column_name);
        } else {
            $column_names = $column_name;
        }
        $cols = array();
        foreach ($column_names as $name) {
            $cols[] = $this->identifier($name);
        }
        $sql = sprintf("CREATE %sINDEX %s ON %s(%s)",
                $unique ? "UNIQUE " : "",
                $this->identifier($index_name),
                $this->identifier($table_name),
                join(", ", $cols));

        return $this->execute_ddl($sql);
    }

    /**
     * Drop an index
     *
     * @param string $table_name the table name
     * @param string $column_name the column name
     * @param array $options index options
     *
     * @throws Ruckusing_Exception
     * @return boolean
     */
    public function remove_index($table_name, $column_name, $options = array())
    {
        if (empty($table_name)) {
            throw new Ruckusing_Exception(
                    "Missing table name parameter",
                    Ruckusing_Exception::INVALID_ARGUMENT
            );
        }
        if (empty($column_name)) {
            throw new Ruckusing_Exception(
                    "Missing column name parameter",
                    Ruckusing_Exception::INVALID_ARGUMENT
            );
        }
        //did the user specify an index name?
        if (is_array($options) && array_key_exists('name', $options)) {
            $index_name = $options['name'];
        } else {
            $index_name = Ruckusing_Util_Naming::index_name($table_name, $column_name);
        }
        $sql = sprintf("DROP INDEX %s ON %s", $this->identifier($index_name), $this->identifier($table_name));

        return $this->execute_ddl($sql);
    }

    /**
     * Check an index
     *
     * @param string $table_name the table name
     * @param string $column_name the column name
     * @param array $options index options
     *
     * @throws Ruckusing_Exception
     * @return boolean
     */
    public function has_index($table_name, $column_name, $options = array())
    {
        if (empty($table_name)) {
            throw new Ruckusing_Exception(
                    "Missing table name parameter",
                    Ruckusing_Exception::INVALID_ARGUMENT
            );
        }
        if (empty($column_name)) {
            throw new Ruckusing_Exception(
                    "Missing column name parameter",
                    Ruckusing_Exception::INVALID_ARGUMENT
            );
        }
        //did the user specify an index name?
        if (is_array($options) && array_key_exists('name', $options)) {
            $index_name = $options['name'];
        } else {
            $index_name = Ruckusing_Util_Naming::index_name($table_name, $column_name);
        }
        $indexes = $this->indexes($table_name);
        foreach ($indexes as $idx) {
            if ($idx['name'] == $index_name) {
                return true;
            }
        }

        return false;
    }

    /**
     * Return all indexes of a table
     *
     * @param string $table_name the table name
     *
     * @return array
     */
    public function indexes($table_name)
    {
        $sql = sprintf("SHOW KEYS FROM %s", $this->identifier($table_name));
        $result = $this->select_all($sql);
        $indexes = array();
        $cur_idx = null;
        foreach ($result as $row) {
            //skip primary
            if ($row['Key_name'] == 'PRIMARY') {
                continue;
            }
            $cur_idx = $row['Key_name'];
            $indexes[] = array('name' => $row['Key_name'], 'unique' => (int) $row['Non_unique'] == 0 ? true : false);
        }

        return $indexes;
    }

    /**
     * Convert type to sql
     * $limit = null, $precision = null, $scale = null
     *
     * @param string $type the native type
     * @param array $options
     *
     * @throws Ruckusing_Exception
     * @return string
     */
    public function type_to_sql($type, $options = array())
    {
        $natives = $this->native_database_types();

        if (!array_key_exists($type, $natives)) {
            $error = sprintf("Error:I dont know what column type of '%s' maps to for MySQL.", $type);
            $error .= "\nYou provided: {$type}\n";
            $error .= "Valid types are: \n";
            $types = array_keys($natives);
            foreach ($types as $t) {
                if ($t == 'primary_key') {
                    continue;
                }
                $error .= "\t{$t}\n";
            }
            throw new Ruckusing_Exception(
                    $error,
                    Ruckusing_Exception::INVALID_ARGUMENT
            );
        }

        $scale = null;
        $precision = null;
        $limit = null;

        if (isset($options['precision'])) {
            $precision = $options['precision'];
        }
        if (isset($options['scale'])) {
            $scale = $options['scale'];
        }
        if (isset($options['limit'])) {
            $limit = $options['limit'];
        }
        if (isset($options['values'])) {
            $values = $options['values'];
        }

        $native_type = $natives[$type];
        if ( is_array($native_type) && array_key_exists('name', $native_type)) {
            $column_type_sql = $native_type['name'];
        } else {
            return $native_type;
        }
        if ($type == "decimal") {
            //ignore limit, use precison and scale
            if ( $precision == null && array_key_exists('precision', $native_type)) {
                $precision = $native_type['precision'];
            }
            if ( $scale == null && array_key_exists('scale', $native_type)) {
                $scale = $native_type['scale'];
            }
            if ($precision != null) {
                if (is_int($scale)) {
                    $column_type_sql .= sprintf("(%d, %d)", $precision, $scale);
                } else {
                    $column_type_sql .= sprintf("(%d)", $precision);
                }//scale
            } else {
                if ($scale) {
                    throw new Ruckusing_Exception(
                            "Error adding decimal column: precision cannot be empty if scale is specified",
                            Ruckusing_Exception::INVALID_ARGUMENT
                    );
                }
            }//precision
        } elseif ($type == "float") {
            //ignore limit, use precison and scale
            if ( $precision == null && array_key_exists('precision', $native_type)) {
                $precision = $native_type['precision'];
            }
            if ( $scale == null && array_key_exists('scale', $native_type)) {
                $scale = $native_type['scale'];
            }
            if ($precision != null) {
                if (is_int($scale)) {
                    $column_type_sql .= sprintf("(%d, %d)", $precision, $scale);
                } else {
                    $column_type_sql .= sprintf("(%d)", $precision);
                }//scale
            } else {
                if ($scale) {
                    throw new Ruckusing_Exception(
                            "Error adding float column: precision cannot be empty if scale is specified",
                            Ruckusing_Exception::INVALID_ARGUMENT
                    );
                }
            }//precision
        } elseif ($type == "enum") {
            if (empty($values)) {
                throw new Ruckusing_Exception(
                        "Error adding enum column: there must be at least one value defined",
                        Ruckusing_Exception::INVALID_ARGUMENT
                );
            } else {
                $column_type_sql .= sprintf("('%s')", implode("','", array_map(array($this, 'quote_string'), $values)));
            }
        }  {
            //not a decimal column
            if ($limit == null && array_key_exists('limit', $native_type)) {
                $limit = $native_type['limit'];
            }
            if ($limit) {
                $column_type_sql .= sprintf("(%d)", $limit);
            }
        }

        return $column_type_sql;
    }

    /**
     * Add column options
     *
     * @param string $type the native type
     * @param array $options
     *
     * @throws Ruckusing_Exception
     * @return string
     */
    public function add_column_options($type, $options)
    {
        $sql = "";

        if(!is_array($options))

            return $sql;

        if (array_key_exists('unsigned', $options) && $options['unsigned'] === true) {
            $sql .= ' UNSIGNED';
        }

        if (array_key_exists('character', $options)) {
        	$sql .= sprintf(" CHARACTER SET %s", $this->identifier($options['character']));
        }
        if (array_key_exists('collate', $options)) {
            $sql .= sprintf(" COLLATE %s", $this->identifier($options['collate']));
        }

        if (array_key_exists('auto_increment', $options) && $options['auto_increment'] === true) {
            $sql .= ' auto_increment';
        }

        if (array_key_exists('default', $options) && $options['default'] !== null) {
            if ($this->is_sql_method_call($options['default'])) {
                //$default_value = $options['default'];
                throw new Ruckusing_Exception(
                        "MySQL does not support function calls as default values, constants only.",
                        Ruckusing_Exception::INVALID_ARGUMENT
                );
            }

            if (is_int($options['default'])) {
                $default_format = '%d';
            } elseif (is_bool($options['default'])) {
                $default_format = "'%d'";
            } else {
                $default_format = "'%s'";
            }
            $default_value = sprintf($default_format, $options['default']);

            $sql .= sprintf(" DEFAULT %s", $default_value);
        }

        if (array_key_exists('null', $options) && ($options['null'] === false || $options['null'] === 'NO')) {
            $sql .= " NOT NULL";
        }
        if (array_key_exists('comment', $options)) {
            $sql .= sprintf(" COMMENT '%s'", $this->quote_string($options['comment']));
        }
        if (array_key_exists('after', $options)) {
            $sql .= sprintf(" AFTER %s", $this->identifier($options['after']));
        }

        return $sql;
    }

    /**
     * Set current version
     *
     * @param string $version the version
     *
     * @return boolean
     */
    public function set_current_version($version)
    {
        $sql = sprintf("INSERT INTO %s (version) VALUES ('%s')", RUCKUSING_TS_SCHEMA_TBL_NAME, $version);

        return $this->execute_ddl($sql);
    }

    /**
     * remove a version
     *
     * @param string $version the version
     *
     * @return boolean
     */
    public function remove_version($version)
    {
        $sql = sprintf("DELETE FROM %s WHERE version = '%s'", RUCKUSING_TS_SCHEMA_TBL_NAME, $version);

        return $this->execute_ddl($sql);
    }

    /**
     * Return a message displaying the current version
     *
     * @return string
     */
    public function __toString()
    {
        return "Ruckusing_Adapter_MySQL_Base, version " . $this->_version;
    }

    //-----------------------------------
    // PRIVATE METHODS
    //-----------------------------------
    /**
    * Connect to the db
    *
    * @param string $dsn the current dsn
    */
    private function connect($dsn)
    {
        $this->db_connect($dsn);
    }

    /**
     * Connect to the db
     *
     * @param string $dsn the current dsn
     *
     * @throws Ruckusing_Exception
     * @return boolean
     */
    private function db_connect($dsn)
    {
        $db_info = $this->get_dsn();
        if ($db_info) {
            $this->db_info = $db_info;
            //we might have a port
            if (empty($db_info['port'])) {
                $db_info['port'] = 3306;
            }
            if (empty($db_info['socket'])) {
                $db_info['socket'] = @ini_get('mysqli.default_socket');
            }
            if (empty($db_info['charset'])) {
                $db_info['charset'] = "utf8";
            }
            $this->conn = new mysqli($db_info['host'], $db_info['user'], $db_info['password'], '', $db_info['port'], $db_info['socket']); //db name leaved for selection
            if ($this->conn->connect_error) {
                throw new Ruckusing_Exception(
                        "\n\nCould not connect to the DB, check host / user / password\n\n",
                        Ruckusing_Exception::INVALID_CONFIG
                );
            }
            if (!$this->conn->select_db($db_info['database'])) {
                throw new Ruckusing_Exception(
                        "\n\nCould not select the DB " . $db_info['database'] . ", check permissions on host " . $db_info['host'] . " \n\n",
                        Ruckusing_Exception::INVALID_CONFIG
                );
            }
            if (!$this->conn->set_charset($db_info['charset'])) {
                throw new Ruckusing_Exception(
                        "\n\nCould not set charset " . $db_info['charset'] . " \n\n",
                        Ruckusing_Exception::INVALID_CONFIG
                );
            }

            $this->conn->query("SET CHARACTER SET '{$db_info['charset']}'");
            $this->conn->query("SET character_set_results = '{$db_info['charset']}'");
            $this->conn->query("SET character_set_server = '{$db_info['charset']}'");
            $this->conn->query("SET character_set_client = '{$db_info['charset']}'");

            return true;
        } else {
            throw new Ruckusing_Exception(
                    "\n\nCould not extract DB connection information from: " . implode(' ', $dsn) . "\n\n",
                    Ruckusing_Exception::INVALID_CONFIG
            );
        }
    }

    /**
     * Delegate to PEAR
     *
     * @param boolean $o
     *
     * @return boolean
     */
    private function isError($o)
    {
        return $o === FALSE;
    }

    /**
     * Initialize an array of table names
     *
     * @param boolean $reload
     */
    private function load_tables($reload = true)
    {
        if ($this->_tables_loaded == false || $reload) {
            $this->_tables = array(); //clear existing structure
            $query = "SHOW TABLES";
            $res = $this->conn->query($query);
            while ($row = $res->fetch_row()) {
                $table = $row[0];
                $this->_tables[$table] = true;
            }
        }
    }

    /**
     * Check query type
     *
     * @param string $query query to run
     *
     * @return int
     */
    private function determine_query_type($query)
    {
        $query = strtolower(trim($query));
        $match = array();
        preg_match('/^(\w)*/i', $query, $match);
        $type = $match[0];

        switch ($type) {
            case 'select':
                return SQL_SELECT;
            case 'update':
                return SQL_UPDATE;
            case 'delete':
                return SQL_DELETE;
            case 'insert':
                return SQL_INSERT;
            case 'alter':
                return SQL_ALTER;
            case 'drop':
                return SQL_DROP;
            case 'create':
                return SQL_CREATE;
            case 'show':
                return SQL_SHOW;
            case 'rename':
                return SQL_RENAME;
            case 'set':
                return SQL_SET;
            default:
                return SQL_UNKNOWN_QUERY_TYPE;
        }
    }

    /**
     * Check query type
     *
     * @param $query_type
     * @internal param string $query query to run
     *
     * @return boolean
     */
    private function is_select($query_type)
    {
        if ($query_type == SQL_SELECT) {
            return true;
        }

        return false;
    }

    /**
     * Detect whether or not the string represents a function call and if so
     * do not wrap it in single-quotes, otherwise do wrap in single quotes.
     *
     * @param string $str
     *
     * @return boolean
     */
    private function is_sql_method_call($str)
    {
        $str = trim($str);
        if (substr($str, -2, 2) == "()") {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Check if in transaction
     *
     * @return boolean
     */
    private function inTransaction()
    {
        return $this->_in_trx;
    }

    /**
     * Start transaction
     */
    private function beginTransaction()
    {
        if ($this->_in_trx === true) {
            throw new Ruckusing_Exception(
                    'Transaction already started',
                    Ruckusing_Exception::QUERY_ERROR
            );
        }
        $this->conn->autocommit(FALSE);
        $this->_in_trx = true;
    }

    /**
     * Commit a transaction
     */
    private function commit()
    {
        if ($this->_in_trx === false) {
            throw new Ruckusing_Exception(
                    'Transaction not started',
                    Ruckusing_Exception::QUERY_ERROR
            );
        }
        $this->conn->commit();
        $this->_in_trx = false;
    }

    /**
     * Rollback a transaction
     */
    private function rollback()
    {
        if ($this->_in_trx === false) {
            throw new Ruckusing_Exception(
                    'Transaction not started',
                    Ruckusing_Exception::QUERY_ERROR
            );
        }
        $this->conn->rollback();
        $this->_in_trx = false;
    }

}
