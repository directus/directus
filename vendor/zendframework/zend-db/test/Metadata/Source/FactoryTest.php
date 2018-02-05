<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Metadata\Source;

use PHPUnit\Framework\TestCase;
use Zend\Db\Adapter\Adapter;
use Zend\Db\Metadata\Source\Factory;

class FactoryTest extends TestCase
{
    /**
     * @dataProvider validAdapterProvider
     *
     * @param Adapter $adapter
     * @param string $expectedReturnClass
     */
    public function testCreateSourceFromAdapter(Adapter $adapter, $expectedReturnClass)
    {
        $source = Factory::createSourceFromAdapter($adapter);

        self::assertInstanceOf('Zend\Db\Metadata\MetadataInterface', $source);
        self::assertInstanceOf($expectedReturnClass, $source);
    }

    public function validAdapterProvider()
    {
        $createAdapterForPlatform = function ($platformName) {
            $platform = $this->getMockBuilder('Zend\Db\Adapter\Platform\PlatformInterface')->getMock();
            $platform
                ->expects($this->any())
                ->method('getName')
                ->willReturn($platformName)
            ;

            $adapter = $this->getMockBuilder('Zend\Db\Adapter\Adapter')
                ->disableOriginalConstructor()
                ->getMock()
            ;

            $adapter
                ->expects($this->any())
                ->method('getPlatform')
                ->willReturn($platform)
            ;

            return $adapter;
        };

        return [
            // Description => [adapter, expected return class]
            'MySQL' => [$createAdapterForPlatform('MySQL'), 'Zend\Db\Metadata\Source\MysqlMetadata'],
            'SQLServer' => [$createAdapterForPlatform('SQLServer'), 'Zend\Db\Metadata\Source\SqlServerMetadata'],
            'SQLite' => [$createAdapterForPlatform('SQLite'), 'Zend\Db\Metadata\Source\SqliteMetadata'],
            'PostgreSQL' => [$createAdapterForPlatform('PostgreSQL'), 'Zend\Db\Metadata\Source\PostgresqlMetadata'],
            'Oracle' => [$createAdapterForPlatform('Oracle'), 'Zend\Db\Metadata\Source\OracleMetadata'],
        ];
    }
}
