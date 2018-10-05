<?php

/**
 * @requires extension nonExistingExtension
 */
class RequirementsClassBeforeClassHookTest extends PHPUnit_Framework_TestCase
{
    public static function setUpBeforeClass()
    {
        throw new Exception(__METHOD__ . ' should not be called because of class requirements.');
    }
}
