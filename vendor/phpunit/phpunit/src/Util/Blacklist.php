<?php
/*
 * This file is part of PHPUnit.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Utility class for blacklisting PHPUnit's own source code files.
 */
class PHPUnit_Util_Blacklist
{
    /**
     * @var array
     */
    public static $blacklistedClassNames = [
        'File_Iterator'                               => 1,
        'PHP_Invoker'                                 => 1,
        'PHP_Timer'                                   => 1,
        'PHP_Token'                                   => 1,
        'PHPUnit_Framework_TestCase'                  => 2,
        'PHPUnit_Extensions_Database_TestCase'        => 2,
        'PHPUnit_Framework_MockObject_Generator'      => 2,
        'Text_Template'                               => 1,
        'Symfony\Component\Yaml\Yaml'                 => 1,
        'SebastianBergmann\CodeCoverage\CodeCoverage' => 1,
        'SebastianBergmann\Diff\Diff'                 => 1,
        'SebastianBergmann\Environment\Runtime'       => 1,
        'SebastianBergmann\Comparator\Comparator'     => 1,
        'SebastianBergmann\Exporter\Exporter'         => 1,
        'SebastianBergmann\GlobalState\Snapshot'      => 1,
        'SebastianBergmann\RecursionContext\Context'  => 1,
        'SebastianBergmann\Version'                   => 1,
        'Composer\Autoload\ClassLoader'               => 1,
        'Doctrine\Instantiator\Instantiator'          => 1,
        'phpDocumentor\Reflection\DocBlock'           => 1,
        'Prophecy\Prophet'                            => 1,
        'DeepCopy\DeepCopy'                           => 1
    ];

    /**
     * @var array
     */
    private static $directories;

    /**
     * @return array
     */
    public function getBlacklistedDirectories()
    {
        $this->initialize();

        return self::$directories;
    }

    /**
     * @param string $file
     *
     * @return bool
     */
    public function isBlacklisted($file)
    {
        if (defined('PHPUNIT_TESTSUITE')) {
            return false;
        }

        $this->initialize();

        foreach (self::$directories as $directory) {
            if (strpos($file, $directory) === 0) {
                return true;
            }
        }

        return false;
    }

    private function initialize()
    {
        if (self::$directories === null) {
            self::$directories = [];

            foreach (self::$blacklistedClassNames as $className => $parent) {
                if (!class_exists($className)) {
                    continue;
                }

                $reflector = new ReflectionClass($className);
                $directory = $reflector->getFileName();

                for ($i = 0; $i < $parent; $i++) {
                    $directory = dirname($directory);
                }

                self::$directories[] = $directory;
            }

            // Hide process isolation workaround on Windows.
            // @see PHPUnit_Util_PHP::factory()
            // @see PHPUnit_Util_PHP_Windows::process()
            if (DIRECTORY_SEPARATOR === '\\') {
                // tempnam() prefix is limited to first 3 chars.
                // @see http://php.net/manual/en/function.tempnam.php
                self::$directories[] = sys_get_temp_dir() . '\\PHP';
            }
        }
    }
}
