<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2014 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Metadata;

interface MetadataInterface
{
    public function getSchemas();

    public function getTableNames($schema = null, $includeViews = false);
    public function getTables($schema = null, $includeViews = false);
    public function getTable($tableName, $schema = null);

    public function getViewNames($schema = null);
    public function getViews($schema = null);
    public function getView($viewName, $schema = null);

    public function getColumnNames($table, $schema = null);
    public function getColumns($table, $schema = null);
    public function getColumn($columnName, $table, $schema = null);

    public function getConstraints($table, $schema = null);
    public function getConstraint($constraintName, $table, $schema = null);
    public function getConstraintKeys($constraint, $table, $schema = null);

    public function getTriggerNames($schema = null);
    public function getTriggers($schema = null);
    public function getTrigger($triggerName, $schema = null);

}
