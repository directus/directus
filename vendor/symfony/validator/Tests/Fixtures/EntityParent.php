<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Validator\Tests\Fixtures;

use Symfony\Component\Validator\Constraints\NotNull;

class EntityParent implements EntityInterfaceA
{
    protected $firstName;
    private $internal;
    private $data = 'Data';
    private $child;

    /**
     * @NotNull
     */
    protected $other;

    public function getData()
    {
        return 'Data';
    }

    public function getChild()
    {
        return $this->child;
    }
}
