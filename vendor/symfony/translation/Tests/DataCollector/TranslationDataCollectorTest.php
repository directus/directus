<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Translation\Tests\DataCollector;

use PHPUnit\Framework\TestCase;
use Symfony\Component\Translation\DataCollector\TranslationDataCollector;
use Symfony\Component\Translation\DataCollectorTranslator;

class TranslationDataCollectorTest extends TestCase
{
    protected function setUp()
    {
        if (!class_exists('Symfony\Component\HttpKernel\DataCollector\DataCollector')) {
            $this->markTestSkipped('The "DataCollector" is not available');
        }
    }

    public function testCollectEmptyMessages()
    {
        $translator = $this->getTranslator();
        $translator->expects($this->any())->method('getCollectedMessages')->will($this->returnValue(array()));

        $dataCollector = new TranslationDataCollector($translator);
        $dataCollector->lateCollect();

        $this->assertEquals(0, $dataCollector->getCountMissings());
        $this->assertEquals(0, $dataCollector->getCountFallbacks());
        $this->assertEquals(0, $dataCollector->getCountDefines());
        $this->assertEquals(array(), $dataCollector->getMessages()->getValue());
    }

    public function testCollect()
    {
        $collectedMessages = array(
            array(
                'id' => 'foo',
                'translation' => 'foo (en)',
                'locale' => 'en',
                'domain' => 'messages',
                'state' => DataCollectorTranslator::MESSAGE_DEFINED,
                'parameters' => array(),
                'transChoiceNumber' => null,
            ),
            array(
                'id' => 'bar',
                'translation' => 'bar (fr)',
                'locale' => 'fr',
                'domain' => 'messages',
                'state' => DataCollectorTranslator::MESSAGE_EQUALS_FALLBACK,
                'parameters' => array(),
                'transChoiceNumber' => null,
            ),
            array(
                'id' => 'choice',
                'translation' => 'choice',
                'locale' => 'en',
                'domain' => 'messages',
                'state' => DataCollectorTranslator::MESSAGE_MISSING,
                'parameters' => array('%count%' => 3),
                'transChoiceNumber' => 3,
            ),
            array(
                'id' => 'choice',
                'translation' => 'choice',
                'locale' => 'en',
                'domain' => 'messages',
                'state' => DataCollectorTranslator::MESSAGE_MISSING,
                'parameters' => array('%count%' => 3),
                'transChoiceNumber' => 3,
            ),
            array(
                'id' => 'choice',
                'translation' => 'choice',
                'locale' => 'en',
                'domain' => 'messages',
                'state' => DataCollectorTranslator::MESSAGE_MISSING,
                'parameters' => array('%count%' => 4, '%foo%' => 'bar'),
                'transChoiceNumber' => 4,
            ),
        );
        $expectedMessages = array(
            array(
                'id' => 'foo',
                'translation' => 'foo (en)',
                'locale' => 'en',
                'domain' => 'messages',
                'state' => DataCollectorTranslator::MESSAGE_DEFINED,
                'count' => 1,
                'parameters' => array(),
                'transChoiceNumber' => null,
            ),
            array(
                'id' => 'bar',
                'translation' => 'bar (fr)',
                'locale' => 'fr',
                'domain' => 'messages',
                'state' => DataCollectorTranslator::MESSAGE_EQUALS_FALLBACK,
                'count' => 1,
                'parameters' => array(),
                'transChoiceNumber' => null,
            ),
            array(
                'id' => 'choice',
                'translation' => 'choice',
                'locale' => 'en',
                'domain' => 'messages',
                'state' => DataCollectorTranslator::MESSAGE_MISSING,
                'count' => 3,
                'parameters' => array(
                    array('%count%' => 3),
                    array('%count%' => 3),
                    array('%count%' => 4, '%foo%' => 'bar'),
                ),
                'transChoiceNumber' => 3,
            ),
        );

        $translator = $this->getTranslator();
        $translator->expects($this->any())->method('getCollectedMessages')->will($this->returnValue($collectedMessages));

        $dataCollector = new TranslationDataCollector($translator);
        $dataCollector->lateCollect();

        $this->assertEquals(1, $dataCollector->getCountMissings());
        $this->assertEquals(1, $dataCollector->getCountFallbacks());
        $this->assertEquals(1, $dataCollector->getCountDefines());

        $this->assertEquals($expectedMessages, array_values($dataCollector->getMessages()->getValue(true)));
    }

    private function getTranslator()
    {
        $translator = $this
            ->getMockBuilder('Symfony\Component\Translation\DataCollectorTranslator')
            ->disableOriginalConstructor()
            ->getMock()
        ;

        return $translator;
    }
}
