<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Metadata;

interface MetadataInterface
{
    /**
     * Get schemas.
     *
     * @return string[]
     */
    public function getSchemas();

    /**
     * Get table names.
     *
     * @param null|string $schema
     * @param bool $includeViews
     * @return string[]
     */
    public function getTableNames($schema = null, $includeViews = false);

    /**
     * Get tables.
     *
     * @param null|string $schema
     * @param bool $includeViews
     * @return Object\TableObject[]
     */
    public function getTables($schema = null, $includeViews = false);

    /**
     * Get table
     *
     * @param string $tableName
     * @param null|string $schema
     * @return Object\TableObject
     */
    public function getTable($tableName, $schema = null);

    /**
     * Get view names
     *
     * @param null|string $schema
     * @return string[]
     */
    public function getViewNames($schema = null);

    /**
     * Get views
     *
     * @param null|string $schema
     * @return Object\ViewObject[]
     */
    public function getViews($schema = null);

    /**
     * Get view
     *
     * @param string $viewName
     * @param null|string $schema
     * @return Object\ViewObject
     */
    public function getView($viewName, $schema = null);

    /**
     * Get column names
     *
     * @param string $table
     * @param null|string $schema
     * @return string[]
     */
    public function getColumnNames($table, $schema = null);

    /**
     * Get columns
     *
     * @param string $table
     * @param null|string $schema
     * @return Object\ColumnObject[]
     */
    public function getColumns($table, $schema = null);

    /**
     * Get column
     *
     * @param string $columnName
     * @param string $table
     * @param null|string $schema
     * @return Object\ColumnObject
     */
    public function getColumn($columnName, $table, $schema = null);

    /**
     * Get constraints
     *
     * @param string $table
     * @param null|string $schema
     * @return Object\ConstraintObject[]
     */
    public function getConstraints($table, $schema = null);

    /**
     * Get constraint
     *
     * @param string $constraintName
     * @param string $table
     * @param null|string $schema
     * @return Object\ConstraintObject
     */
    public function getConstraint($constraintName, $table, $schema = null);

    /**
     * Get constraint keys
     *
     * @param string $constraint
     * @param string $table
     * @param null|string $schema
     * @return Object\ConstraintKeyObject[]
     */
    public function getConstraintKeys($constraint, $table, $schema = null);

    /**
     * Get trigger names
     *
     * @param null|string $schema
     * @return string[]
     */
    public function getTriggerNames($schema = null);

    /**
     * Get triggers
     *
     * @param null|string $schema
     * @return Object\TriggerObject[]
     */
    public function getTriggers($schema = null);

    /**
     * Get trigger
     *
     * @param string $triggerName
     * @param null|string $schema
     * @return Object\TriggerObject
     */
    public function getTrigger($triggerName, $schema = null);
}
