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
 * Suite for .phpt test cases.
 */
class PHPUnit_Extensions_PhptTestSuite extends PHPUnit_Framework_TestSuite
{
    /**
     * Constructs a new TestSuite for .phpt test cases.
     *
     * @param string $directory
     *
     * @throws PHPUnit_Framework_Exception
     */
    public function __construct($directory)
    {
        if (is_string($directory) && is_dir($directory)) {
            $this->setName($directory);

            $facade = new File_Iterator_Facade;
            $files  = $facade->getFilesAsArray($directory, '.phpt');

            foreach ($files as $file) {
                $this->addTestFile($file);
            }
        } else {
            throw PHPUnit_Util_InvalidArgumentHelper::factory(1, 'directory name');
        }
    }
}
