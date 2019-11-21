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
use Cache\IntegrationTests\SimpleCacheTest as BaseTest;

class IntegrationSimpleCacheTest extends BaseTest
{
    protected $skippedTests = [
        'testSet'                        => 'Void adapter does not save,',
        'testSetTtl'                     => 'Void adapter does not save,',
        'testGet'                        => 'Void adapter does not save,',
        'testSetMultiple'                => 'Void adapter does not save,',
        'testSetMultipleTtl'             => 'Void adapter does not save,',
        'testSetMultipleWithGenerator'   => 'Void adapter does not save,',
        'testGetMultiple'                => 'Void adapter does not save,',
        'testGetMultipleWithGenerator'   => 'Void adapter does not save,',
        'testHas'                        => 'Void adapter does not save,',
        'testBinaryData'                 => 'Void adapter does not save,',
        'testDataTypeString'             => 'Void adapter does not save,',
        'testDataTypeInteger'            => 'Void adapter does not save,',
        'testDataTypeFloat'              => 'Void adapter does not save,',
        'testDataTypeBoolean'            => 'Void adapter does not save,',
        'testDataTypeArray'              => 'Void adapter does not save,',
        'testDataTypeObject'             => 'Void adapter does not save,',
        'testSetValidKeys'               => 'Void adapter does not save,',
        'testSetMultipleValidKeys'       => 'Void adapter does not save,',
        'testSetMultipleInvalidKeys'     => 'Void adapter does not save,',
        'testSetValidData'               => 'Void adapter does not save,',
        'testSetMultipleValidData'       => 'Void adapter does not save,',
        'testObjectDoesNotChangeInCache' => 'Void adapter does not save,',
    ];

    public function createSimpleCache()
    {
        return new VoidCachePool();
    }
}
