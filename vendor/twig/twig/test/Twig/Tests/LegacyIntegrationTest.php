<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Twig_Tests_LegacyIntegrationTest extends Twig_Test_IntegrationTestCase
{
    public function getExtensions()
    {
        return array(
            new LegacyTwigTestExtension(),
        );
    }

    public function getFixturesDir()
    {
        return dirname(__FILE__).'/LegacyFixtures/';
    }

    public function getTests($name, $legacyTests = false)
    {
        if (!$legacyTests) {
            return array(array('', '', '', array(), '', array()));
        }

        return parent::getTests($name, true);
    }
}

class LegacyTwigTestExtension extends Twig_Extension
{
    public function getTests()
    {
        return array(
            'multi word' => new Twig_Test_Method($this, 'is_multi_word'),
        );
    }

    public function is_multi_word($value)
    {
        return false !== strpos($value, ' ');
    }

    public function getName()
    {
        return 'legacy_integration_test';
    }
}
