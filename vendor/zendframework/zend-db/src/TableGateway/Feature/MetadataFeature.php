<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\TableGateway\Feature;

use Zend\Db\Metadata\MetadataInterface;
use Zend\Db\TableGateway\Exception;
use Zend\Db\Metadata\Object\TableObject;
use Zend\Db\Metadata\Source\Factory as SourceFactory;

class MetadataFeature extends AbstractFeature
{
    /**
     * @var MetadataInterface
     */
    protected $metadata = null;

    /**
     * Constructor
     *
     * @param MetadataInterface $metadata
     */
    public function __construct(MetadataInterface $metadata = null)
    {
        if ($metadata) {
            $this->metadata = $metadata;
        }
        $this->sharedData['metadata'] = [
            'primaryKey' => null,
            'columns' => []
        ];
    }

    public function postInitialize()
    {
        if ($this->metadata === null) {
            $this->metadata = SourceFactory::createSourceFromAdapter($this->tableGateway->adapter);
        }

        // localize variable for brevity
        $t = $this->tableGateway;
        $m = $this->metadata;

        // get column named
        $columns = $m->getColumnNames($t->table);
        $t->columns = $columns;

        // set locally
        $this->sharedData['metadata']['columns'] = $columns;

        // process primary key only if table is a table; there are no PK constraints on views
        if (!($m->getTable($t->table) instanceof TableObject)) {
            return;
        }

        $pkc = null;

        foreach ($m->getConstraints($t->table) as $constraint) {
            /** @var $constraint \Zend\Db\Metadata\Object\ConstraintObject */
            if ($constraint->getType() == 'PRIMARY KEY') {
                $pkc = $constraint;
                break;
            }
        }

        if ($pkc === null) {
            throw new Exception\RuntimeException('A primary key for this column could not be found in the metadata.');
        }

        if (count($pkc->getColumns()) == 1) {
            $pkck = $pkc->getColumns();
            $primaryKey = $pkck[0];
        } else {
            $primaryKey = $pkc->getColumns();
        }

        $this->sharedData['metadata']['primaryKey'] = $primaryKey;
    }
}
