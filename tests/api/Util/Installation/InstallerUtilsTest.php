<?php

use Directus\Util\Installation\InstallerUtils;

class InstallerUtilsTest extends PHPUnit_Framework_TestCase
{
    public function testCreateFileException()
    {
        $this->setExpectedException('InvalidArgumentException');
        InstallerUtils::createConfig([], __DIR__ . '/');
    }

    public function testVariableReplacement()
    {
        $result = InstallerUtils::replacePlaceholderValues('{{name}}', ['name' => 'John']);
        $this->assertSame($result, 'John');

        $result = InstallerUtils::replacePlaceholderValues('{{user.name}}', [
            'user' => [
                'name' => 'John'
            ]
        ]);
        $this->assertSame($result, 'John');

        $result = InstallerUtils::replacePlaceholderValues('{{user.country.name}}', [
            'user' => [
                'name' => 'John',
                'country' => [
                    'name' => 'yes'
                ]
            ]
        ]);
        $this->assertSame($result, 'yes');
    }

    public function testCreateFiles()
    {
        InstallerUtils::createConfig([
            'db_type' => 'mysql',
            'db_port' => 3306,
            'db_host' => 'localhost',
            'db_name' => 'directus',
            'db_user' => 'root',
            'db_password' => 'password',
            'directus_path' => '/directus/',
            'directus_email' => 'admin@directus.local',
            'feedback_token' => 'token',
            'feedback_login' => true
        ], __DIR__ . '/');

        $this->assertSame(sha1_file(__DIR__ . '/mock/config.sample.php'), sha1_file(__DIR__ . '/config.php'));
        $this->assertSame(sha1_file(__DIR__ . '/mock/configuration.sample.php'), sha1_file(__DIR__ . '/configuration.php'));
    }

    public function testCreateFiles2()
    {
        $this->tearDown();

        InstallerUtils::createConfig([
            'db_type' => 'mysql',
            'db_port' => 3306,
            'db_host' => 'localhost',
            'db_name' => 'directus',
            'db_user' => 'root',
            'db_password' => 'password',
            'directus_path' => '/directus/',
            'feedback_token' => 'token',
            'feedback_login' => true
        ], __DIR__ . '/');

        $this->assertSame(sha1_file(__DIR__ . '/mock/config.sample.php'), sha1_file(__DIR__ . '/config.php'));
        $this->assertSame(sha1_file(__DIR__ . '/mock/configuration.sample2.php'), sha1_file(__DIR__ . '/configuration.php'));
    }

    public function tearDown()
    {
        if (file_exists(__DIR__ . '/config.php')) {
            unlink(__DIR__ . '/config.php');
        }

        if (file_exists(__DIR__ . '/configuration.php')) {
            unlink(__DIR__ . '/configuration.php');
        }
    }
}
