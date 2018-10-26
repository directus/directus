<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Metadata\Source;

use Zend\Db\Adapter\Adapter;
use Zend\Db\Metadata\Source\OracleMetadata;
use ZendTest\Db\Adapter\Driver\Oci8\AbstractIntegrationTest;

/**
 * @requires extension oci8
 */
class OracleMetadataTest extends AbstractIntegrationTest
{
    /**
     * @var OracleMetadata
     */
    protected $metadata;

    /**
     * @var Adapter
     */
    protected $adapter;

    /**
     * Sets up the fixture, for example, opens a network connection.
     * This method is called before a test is executed.
     */
    protected function setUp()
    {
        if (! extension_loaded('oci8')) {
            $this->markTestSkipped('I cannot test without the oci8 extension');
        }
        parent::setUp();
        $this->variables['driver'] = 'OCI8';
        $this->adapter = new Adapter($this->variables);
        $this->metadata = new OracleMetadata($this->adapter);
    }

    public function testGetConstraints()
    {
        $constraints = $this->metadata->getConstraints(null, 'main');
        self::assertCount(0, $constraints);
        self::assertContainsOnlyInstancesOf(
            'Zend\Db\Metadata\Object\ConstraintObject',
            $constraints
        );
    }
}
