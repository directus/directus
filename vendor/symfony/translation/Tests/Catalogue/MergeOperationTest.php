<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Translation\Tests\Catalogue;

use Symfony\Component\Translation\Catalogue\MergeOperation;
use Symfony\Component\Translation\MessageCatalogue;
use Symfony\Component\Translation\MessageCatalogueInterface;

class MergeOperationTest extends AbstractOperationTest
{
    public function testGetMessagesFromSingleDomain()
    {
        $operation = $this->createOperation(
            new MessageCatalogue('en', array('messages' => array('a' => 'old_a', 'b' => 'old_b'))),
            new MessageCatalogue('en', array('messages' => array('a' => 'new_a', 'c' => 'new_c')))
        );

        $this->assertEquals(
            array('a' => 'old_a', 'b' => 'old_b', 'c' => 'new_c'),
            $operation->getMessages('messages')
        );

        $this->assertEquals(
            array('c' => 'new_c'),
            $operation->getNewMessages('messages')
        );

        $this->assertEquals(
            array(),
            $operation->getObsoleteMessages('messages')
        );
    }

    public function testGetResultFromSingleDomain()
    {
        $this->assertEquals(
            new MessageCatalogue('en', array(
                'messages' => array('a' => 'old_a', 'b' => 'old_b', 'c' => 'new_c'),
            )),
            $this->createOperation(
                new MessageCatalogue('en', array('messages' => array('a' => 'old_a', 'b' => 'old_b'))),
                new MessageCatalogue('en', array('messages' => array('a' => 'new_a', 'c' => 'new_c')))
            )->getResult()
        );
    }

    public function testGetResultFromIntlDomain()
    {
        $this->assertEquals(
            new MessageCatalogue('en', array(
                'messages' => array('a' => 'old_a', 'b' => 'old_b'),
                'messages+intl-icu' => array('d' => 'old_d', 'c' => 'new_c'),
            )),
            $this->createOperation(
                new MessageCatalogue('en', array('messages' => array('a' => 'old_a', 'b' => 'old_b'), 'messages+intl-icu' => array('d' => 'old_d'))),
                new MessageCatalogue('en', array('messages+intl-icu' => array('a' => 'new_a', 'c' => 'new_c')))
            )->getResult()
        );
    }

    public function testGetResultWithMetadata()
    {
        $leftCatalogue = new MessageCatalogue('en', array('messages' => array('a' => 'old_a', 'b' => 'old_b')));
        $leftCatalogue->setMetadata('a', 'foo', 'messages');
        $leftCatalogue->setMetadata('b', 'bar', 'messages');
        $rightCatalogue = new MessageCatalogue('en', array('messages' => array('b' => 'new_b', 'c' => 'new_c')));
        $rightCatalogue->setMetadata('b', 'baz', 'messages');
        $rightCatalogue->setMetadata('c', 'qux', 'messages');

        $mergedCatalogue = new MessageCatalogue('en', array('messages' => array('a' => 'old_a', 'b' => 'old_b', 'c' => 'new_c')));
        $mergedCatalogue->setMetadata('a', 'foo', 'messages');
        $mergedCatalogue->setMetadata('b', 'bar', 'messages');
        $mergedCatalogue->setMetadata('c', 'qux', 'messages');

        $this->assertEquals(
            $mergedCatalogue,
            $this->createOperation(
                $leftCatalogue,
                $rightCatalogue
            )->getResult()
        );
    }

    protected function createOperation(MessageCatalogueInterface $source, MessageCatalogueInterface $target)
    {
        return new MergeOperation($source, $target);
    }
}
