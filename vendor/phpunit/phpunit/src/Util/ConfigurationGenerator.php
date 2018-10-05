<?php
/*
 * This file is part of PHPUnit.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class PHPUnit_Util_ConfigurationGenerator
{
    /**
     * @var string
     */
    private $defaultTemplate = <<<EOT
<?xml version="1.0" encoding="UTF-8"?>
<phpunit xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="https://schema.phpunit.de/{phpunit_version}/phpunit.xsd"
         bootstrap="{bootstrap_script}"
         backupGlobals="false"
         beStrictAboutCoversAnnotation="true"
         beStrictAboutOutputDuringTests="true"
         beStrictAboutTestsThatDoNotTestAnything="true"
         beStrictAboutTodoAnnotatedTests="true"
         verbose="true">
    <testsuite name="default">
        <directory suffix="Test.php">{tests_directory}</directory>
    </testsuite>

    <filter>
        <whitelist processUncoveredFilesFromWhitelist="true">
            <directory suffix=".php">{src_directory}</directory>
        </whitelist>
    </filter>
</phpunit>

EOT;

    /**
     * @param string $phpunitVersion
     * @param string $bootstrapScript
     * @param string $testsDirectory
     * @param string $srcDirectory
     *
     * @return string
     */
    public function generateDefaultConfiguration($phpunitVersion, $bootstrapScript, $testsDirectory, $srcDirectory)
    {
        return str_replace(
            [
                '{phpunit_version}',
                '{bootstrap_script}',
                '{tests_directory}',
                '{src_directory}'
            ],
            [
                $phpunitVersion,
                $bootstrapScript,
                $testsDirectory,
                $srcDirectory
            ],
            $this->defaultTemplate
        );
    }
}
