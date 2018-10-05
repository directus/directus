<?php
/*
 * This file is part of PHPUnit.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Util_ConfigurationTest extends PHPUnit_Framework_TestCase
{
    /**
     * @var PHPUnit_Util_Configuration
     */
    protected $configuration;

    protected function setUp()
    {
        $this->configuration = PHPUnit_Util_Configuration::getInstance(
            dirname(__DIR__) . DIRECTORY_SEPARATOR . '_files' . DIRECTORY_SEPARATOR . 'configuration.xml'
        );
    }

    /**
     * @expectedException PHPUnit_Framework_Exception
     */
    public function testExceptionIsThrownForNotExistingConfigurationFile()
    {
        PHPUnit_Util_Configuration::getInstance('not_existing_file.xml');
    }

    public function testShouldReadColorsWhenTrueInConfigurationfile()
    {
        $configurationFilename =  dirname(__DIR__) . DIRECTORY_SEPARATOR . '_files' . DIRECTORY_SEPARATOR . 'configuration.colors.true.xml';
        $configurationInstance = PHPUnit_Util_Configuration::getInstance($configurationFilename);
        $configurationValues   = $configurationInstance->getPHPUnitConfiguration();

        $this->assertEquals(PHPUnit_TextUI_ResultPrinter::COLOR_AUTO, $configurationValues['colors']);
    }

    public function testShouldReadColorsWhenFalseInConfigurationfile()
    {
        $configurationFilename =  dirname(__DIR__) . DIRECTORY_SEPARATOR . '_files' . DIRECTORY_SEPARATOR . 'configuration.colors.false.xml';
        $configurationInstance = PHPUnit_Util_Configuration::getInstance($configurationFilename);
        $configurationValues   = $configurationInstance->getPHPUnitConfiguration();

        $this->assertEquals(PHPUnit_TextUI_ResultPrinter::COLOR_NEVER, $configurationValues['colors']);
    }

    public function testShouldReadColorsWhenEmptyInConfigurationfile()
    {
        $configurationFilename =  dirname(__DIR__) . DIRECTORY_SEPARATOR . '_files' . DIRECTORY_SEPARATOR . 'configuration.colors.empty.xml';
        $configurationInstance = PHPUnit_Util_Configuration::getInstance($configurationFilename);
        $configurationValues   = $configurationInstance->getPHPUnitConfiguration();

        $this->assertEquals(PHPUnit_TextUI_ResultPrinter::COLOR_NEVER, $configurationValues['colors']);
    }

    public function testShouldReadColorsWhenInvalidInConfigurationfile()
    {
        $configurationFilename =  dirname(__DIR__) . DIRECTORY_SEPARATOR . '_files' . DIRECTORY_SEPARATOR . 'configuration.colors.invalid.xml';
        $configurationInstance = PHPUnit_Util_Configuration::getInstance($configurationFilename);
        $configurationValues   = $configurationInstance->getPHPUnitConfiguration();

        $this->assertEquals(PHPUnit_TextUI_ResultPrinter::COLOR_NEVER, $configurationValues['colors']);
    }

    public function testFilterConfigurationIsReadCorrectly()
    {
        $this->assertEquals(
            [
            'whitelist' =>
            [
              'addUncoveredFilesFromWhitelist'     => true,
              'processUncoveredFilesFromWhitelist' => false,
              'include'                            =>
              [
                'directory' =>
                [
                  0 =>
                  [
                    'path'   => '/path/to/files',
                    'prefix' => '',
                    'suffix' => '.php',
                    'group'  => 'DEFAULT'
                  ],
                ],
                'file' =>
                [
                  0 => '/path/to/file',
                  1 => '/path/to/file',
                ],
              ],
              'exclude' =>
              [
                'directory' =>
                [
                  0 =>
                  [
                    'path'   => '/path/to/files',
                    'prefix' => '',
                    'suffix' => '.php',
                    'group'  => 'DEFAULT'
                  ],
                ],
                'file' =>
                [
                  0 => '/path/to/file',
                ],
              ],
            ],
            ],
            $this->configuration->getFilterConfiguration()
        );
    }

    public function testGroupConfigurationIsReadCorrectly()
    {
        $this->assertEquals(
            [
            'include' =>
            [
              0 => 'name',
            ],
            'exclude' =>
            [
              0 => 'name',
            ],
            ],
            $this->configuration->getGroupConfiguration()
        );
    }

    public function testTestdoxGroupConfigurationIsReadCorrectly()
    {
        $this->assertEquals(
            [
                'include' =>
                    [
                        0 => 'name',
                    ],
                'exclude' =>
                    [
                        0 => 'name',
                    ],
            ],
            $this->configuration->getTestdoxGroupConfiguration()
        );
    }

    public function testListenerConfigurationIsReadCorrectly()
    {
        $dir         = __DIR__;
        $includePath = ini_get('include_path');

        ini_set('include_path', $dir . PATH_SEPARATOR . $includePath);

        $this->assertEquals(
            [
            0 =>
            [
              'class'     => 'MyListener',
              'file'      => '/optional/path/to/MyListener.php',
              'arguments' =>
              [
                0 =>
                [
                  0 => 'Sebastian',
                ],
                1 => 22,
                2 => 'April',
                3 => 19.78,
                4 => null,
                5 => new stdClass,
                6 => dirname(__DIR__) . DIRECTORY_SEPARATOR . '_files' . DIRECTORY_SEPARATOR . 'MyTestFile.php',
                7 => dirname(__DIR__) . DIRECTORY_SEPARATOR . '_files' . DIRECTORY_SEPARATOR . 'MyRelativePath',
              ],
            ],
            [
              'class'     => 'IncludePathListener',
              'file'      => __FILE__,
              'arguments' => []
            ],
            [
              'class'     => 'CompactArgumentsListener',
              'file'      => '/CompactArgumentsListener.php',
              'arguments' =>
              [
                0 => 42
              ],
            ],
            ],
            $this->configuration->getListenerConfiguration()
        );

        ini_set('include_path', $includePath);
    }

    public function testLoggingConfigurationIsReadCorrectly()
    {
        $this->assertEquals(
            [
            'lowUpperBound'        => '50',
            'highLowerBound'       => '90',
            'coverage-html'        => '/tmp/report',
            'coverage-clover'      => '/tmp/clover.xml',
            'json'                 => '/tmp/logfile.json',
            'plain'                => '/tmp/logfile.txt',
            'tap'                  => '/tmp/logfile.tap',
            'logIncompleteSkipped' => false,
            'junit'                => '/tmp/logfile.xml',
            'testdox-html'         => '/tmp/testdox.html',
            'testdox-text'         => '/tmp/testdox.txt',
            'testdox-xml'          => '/tmp/testdox.xml'
            ],
            $this->configuration->getLoggingConfiguration()
        );
    }

    public function testPHPConfigurationIsReadCorrectly()
    {
        $this->assertEquals(
            [
            'include_path' =>
            [
              dirname(__DIR__) . DIRECTORY_SEPARATOR . '_files' . DIRECTORY_SEPARATOR . '.',
              '/path/to/lib'
            ],
            'ini'    => ['foo' => 'bar'],
            'const'  => ['FOO' => false, 'BAR' => true],
            'var'    => ['foo' => false],
            'env'    => ['foo' => true],
            'post'   => ['foo' => 'bar'],
            'get'    => ['foo' => 'bar'],
            'cookie' => ['foo' => 'bar'],
            'server' => ['foo' => 'bar'],
            'files'  => ['foo' => 'bar'],
            'request'=> ['foo' => 'bar'],
            ],
            $this->configuration->getPHPConfiguration()
        );
    }

    /**
     * @backupGlobals enabled
     */
    public function testPHPConfigurationIsHandledCorrectly()
    {
        $this->configuration->handlePHPConfiguration();

        $path = dirname(__DIR__) . DIRECTORY_SEPARATOR . '_files' . DIRECTORY_SEPARATOR . '.' . PATH_SEPARATOR . '/path/to/lib';
        $this->assertStringStartsWith($path, ini_get('include_path'));
        $this->assertEquals(false, FOO);
        $this->assertEquals(true, BAR);
        $this->assertEquals(false, $GLOBALS['foo']);
        $this->assertEquals(true, $_ENV['foo']);
        $this->assertEquals(true, getenv('foo'));
        $this->assertEquals('bar', $_POST['foo']);
        $this->assertEquals('bar', $_GET['foo']);
        $this->assertEquals('bar', $_COOKIE['foo']);
        $this->assertEquals('bar', $_SERVER['foo']);
        $this->assertEquals('bar', $_FILES['foo']);
        $this->assertEquals('bar', $_REQUEST['foo']);
    }

    /**
     * @backupGlobals enabled
     *
     * @see https://github.com/sebastianbergmann/phpunit/issues/1181
     */
    public function testHandlePHPConfigurationDoesNotOverwrittenExistingEnvArrayVariables()
    {
        $_ENV['foo'] = false;
        $this->configuration->handlePHPConfiguration();

        $this->assertEquals(false, $_ENV['foo']);
        $this->assertEquals(true, getenv('foo'));
    }

    /**
     * @backupGlobals enabled
     *
     * @see https://github.com/sebastianbergmann/phpunit/issues/1181
     */
    public function testHandlePHPConfigurationDoesNotOverriteVariablesFromPutEnv()
    {
        putenv('foo=putenv');
        $this->configuration->handlePHPConfiguration();

        $this->assertEquals(true, $_ENV['foo']);
        $this->assertEquals('putenv', getenv('foo'));
    }

    public function testPHPUnitConfigurationIsReadCorrectly()
    {
        $this->assertEquals(
            [
            'backupGlobals'                              => true,
            'backupStaticAttributes'                     => false,
            'beStrictAboutChangesToGlobalState'          => false,
            'bootstrap'                                  => '/path/to/bootstrap.php',
            'cacheTokens'                                => false,
            'columns'                                    => 80,
            'colors'                                     => 'never',
            'stderr'                                     => false,
            'convertErrorsToExceptions'                  => true,
            'convertNoticesToExceptions'                 => true,
            'convertWarningsToExceptions'                => true,
            'forceCoversAnnotation'                      => false,
            'stopOnFailure'                              => false,
            'stopOnWarning'                              => false,
            'reportUselessTests'                         => false,
            'strictCoverage'                             => false,
            'disallowTestOutput'                         => false,
            'enforceTimeLimit'                           => false,
            'extensionsDirectory'                        => '/tmp',
            'printerClass'                               => 'PHPUnit_TextUI_ResultPrinter',
            'testSuiteLoaderClass'                       => 'PHPUnit_Runner_StandardTestSuiteLoader',
            'verbose'                                    => false,
            'timeoutForSmallTests'                       => 1,
            'timeoutForMediumTests'                      => 10,
            'timeoutForLargeTests'                       => 60,
            'beStrictAboutResourceUsageDuringSmallTests' => false,
            'disallowTodoAnnotatedTests'                 => false,
            'failOnWarning'                              => false,
            'failOnRisky'                                => false
            ],
            $this->configuration->getPHPUnitConfiguration()
        );
    }

    public function testXincludeInConfiguration()
    {
        $configurationWithXinclude = PHPUnit_Util_Configuration::getInstance(
            dirname(__DIR__) . DIRECTORY_SEPARATOR . '_files' . DIRECTORY_SEPARATOR . 'configuration_xinclude.xml'
        );

        $this->assertConfigurationEquals(
            $this->configuration,
            $configurationWithXinclude
        );
    }

    /**
     * @ticket 1311
     *
     * @uses   PHPUnit_Util_Configuration::getInstance
     */
    public function testWithEmptyConfigurations()
    {
        $emptyConfiguration = PHPUnit_Util_Configuration::getInstance(
            dirname(__DIR__) . DIRECTORY_SEPARATOR . '_files' . DIRECTORY_SEPARATOR . 'configuration_empty.xml'
        );

        $logging = $emptyConfiguration->getLoggingConfiguration();
        $this->assertEmpty($logging);

        $php = $emptyConfiguration->getPHPConfiguration();
        $this->assertEmpty($php['include_path']);

        $phpunit = $emptyConfiguration->getPHPUnitConfiguration();
        $this->assertArrayNotHasKey('bootstrap', $phpunit);
        $this->assertArrayNotHasKey('testSuiteLoaderFile', $phpunit);
        $this->assertArrayNotHasKey('printerFile', $phpunit);

        $suite = $emptyConfiguration->getTestSuiteConfiguration();
        $this->assertEmpty($suite->getGroups());

        $filter = $emptyConfiguration->getFilterConfiguration();
        $this->assertEmpty($filter['whitelist']['include']['directory']);
        $this->assertEmpty($filter['whitelist']['include']['file']);
        $this->assertEmpty($filter['whitelist']['exclude']['directory']);
        $this->assertEmpty($filter['whitelist']['exclude']['file']);
    }

    /**
     * Asserts that the values in $actualConfiguration equal $expectedConfiguration.
     *
     * @param PHPUnit_Util_Configuration $expectedConfiguration
     * @param PHPUnit_Util_Configuration $actualConfiguration
     */
    protected function assertConfigurationEquals(PHPUnit_Util_Configuration $expectedConfiguration, PHPUnit_Util_Configuration $actualConfiguration)
    {
        $this->assertEquals(
            $expectedConfiguration->getFilterConfiguration(),
            $actualConfiguration->getFilterConfiguration()
        );

        $this->assertEquals(
            $expectedConfiguration->getGroupConfiguration(),
            $actualConfiguration->getGroupConfiguration()
        );

        $this->assertEquals(
            $expectedConfiguration->getListenerConfiguration(),
            $actualConfiguration->getListenerConfiguration()
        );

        $this->assertEquals(
            $expectedConfiguration->getLoggingConfiguration(),
            $actualConfiguration->getLoggingConfiguration()
        );

        $this->assertEquals(
            $expectedConfiguration->getPHPConfiguration(),
            $actualConfiguration->getPHPConfiguration()
        );

        $this->assertEquals(
            $expectedConfiguration->getPHPUnitConfiguration(),
            $actualConfiguration->getPHPUnitConfiguration()
        );

        $this->assertEquals(
            $expectedConfiguration->getTestSuiteConfiguration(),
            $actualConfiguration->getTestSuiteConfiguration()
        );
    }

    public function testGetTestSuiteNamesReturnsTheNamesIfDefined()
    {
        $configuration = PHPUnit_Util_Configuration::getInstance(
            dirname(__DIR__) . DIRECTORY_SEPARATOR . '_files' . DIRECTORY_SEPARATOR . 'configuration.suites.xml'
        );

        $names = $configuration->getTestSuiteNames();

        $this->assertEquals(['Suite One', 'Suite Two'], $names);
    }
}
