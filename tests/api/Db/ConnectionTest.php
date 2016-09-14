<?php

class ConnectionTest extends PHPUnit_Framework_TestCase
{
    public function testConnect()
    {
        $connection = get_mock_connection($this);

        $adapterConnection = $connection->getDriver()->getConnection();
        $adapterConnection->expects($this->once())
            ->method('connect');

        $connection->connect();
    }

    public function testStrictMode()
    {
        $connection = get_mock_connection($this, [
            'result_data' => ['modes' => 'NOTHING,HERE']
        ]);

        $this->assertFalse($connection->isStrictModeEnabled());

        $connection = get_mock_connection($this, [
            'platform_name' => 'sqlite'
        ]);

        $this->assertFalse($connection->isStrictModeEnabled());

        $connection = get_mock_connection($this, [
            'platform_name' => 'mysql',
            'result_data' => ['modes' => 'STRICT_ALL_TABLES,NOTHING']
        ]);

        $this->assertTrue($connection->isStrictModeEnabled());
    }
}
