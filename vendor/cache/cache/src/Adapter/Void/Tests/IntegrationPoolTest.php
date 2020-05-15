<?php

/*
 * This file is part of php-cache organization.
 *
 * (c) 2015 Aaron Scherer <aequasi@gmail.com>, Tobias Nyholm <tobias.nyholm@gmail.com>
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Cache\Adapter\Void\Tests;

use Cache\Adapter\Void\VoidCachePool;
use Cache\IntegrationTests\CachePoolTest as BaseTest;

class IntegrationPoolTest extends BaseTest
{
    protected $skippedTests = [
        'testBasicUsage'                     => 'Void adapter does not save,',
        'testGetItem'                        => 'Void adapter does not save,',
        'testGetItems'                       => 'Void adapter does not save,',
        'testHasItem'                        => 'Void adapter does not save,',
        'testDeleteItems'                    => 'Void adapter does not save,',
        'testSave'                           => 'Void adapter does not save,',
        'testSaveWithoutExpire'              => 'Void adapter does not save,',
        'testDataTypeFloat'                  => 'Void adapter only outputs boolean,',
        'testDataTypeBoolean'                => 'Void adapter only outputs boolean,',
        'testDataTypeArray'                  => 'Void adapter only outputs boolean,',
        'testDataTypeObject'                 => 'Void adapter only outputs boolean,',
        'testBinaryData'                     => 'Void adapter only outputs boolean,',
        'testDeferredSave'                   => 'Void adapter does not save,',
        'testDeferredSaveWithoutCommit'      => 'Void adapter does not save,',
        'testCommit'                         => 'Void adapter does not save,',
        'testExpiresAt'                      => 'Void adapter does not save,',
        'testExpiresAtWithNull'              => 'Void adapter does not save,',
        'testExpiresAfterWithNull'           => 'Void adapter does not save,',
        'testKeyLength'                      => 'Void adapter does not save,',
        'testDataTypeString'                 => 'Void adapter does not save,',
        'testDataTypeInteger'                => 'Void adapter does not save,',
        'testDataTypeNull'                   => 'Void adapter does not save,',
        'testIsHit'                          => 'Void adapter does not save,',
        'testIsHitDeferred'                  => 'Void adapter does not save,',
        'testSaveDeferredWhenChangingValues' => 'Void adapter does not save,',
        'testSavingObject'                   => 'Void adapter does not save,',
        'testSaveDeferredOverwrite'          => 'Void adapter does not save,',
    ];

    public function createCachePool()
    {
        return new VoidCachePool();
    }
}
