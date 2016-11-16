<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2014 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Sql\Ddl;

use Zend\Db\Adapter\Platform\PlatformInterface;
use Zend\Db\Adapter\Platform\Sql92 as AdapterSql92Platform;
use Zend\Db\Sql\AbstractSql;

class DropTable extends AbstractSql implements SqlInterface
{
    const TABLE = 'table';

    /**
     * @var array
     */
    protected $specifications = array(
        self::TABLE => 'DROP TABLE %1$s'
    );

    /**
     * @var string
     */
    protected $table = '';

    /**
     * @param string $table
     */
    public function __construct($table = '')
    {
        $this->table = $table;
    }

    /**
     * @param  null|PlatformInterface $adapterPlatform
     * @return string
     */
    public function getSqlString(PlatformInterface $adapterPlatform = null)
    {
        // get platform, or create default
        $adapterPlatform = ($adapterPlatform) ?: new AdapterSql92Platform;

        $sqls       = array();
        $parameters = array();

        foreach ($this->specifications as $name => $specification) {
            $parameters[$name] = $this->{'process' . $name}(
                $adapterPlatform,
                null,
                null,
                $sqls,
                $parameters
            );

            if ($specification && is_array($parameters[$name])) {
                $sqls[$name] = $this->createSqlFromSpecificationAndParameters(
                    $specification,
                    $parameters[$name]
                );
            }
        }

        $sql = implode(' ', $sqls);
        return $sql;
    }

    protected function processTable(PlatformInterface $adapterPlatform = null)
    {
        return array($adapterPlatform->quoteIdentifier($this->table));
    }
}
