<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Validator\Tests\Constraints;

use Symfony\Component\Validator\Constraints\File;

class FileValidatorPathTest extends FileValidatorTest
{
    protected function getFile($filename)
    {
        return $filename;
    }

    public function testFileNotFound()
    {
        $constraint = new File(array(
            'notFoundMessage' => 'myMessage',
        ));

        $this->validator->validate('foobar', $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ file }}', '"foobar"')
            ->setCode(File::NOT_FOUND_ERROR)
            ->assertRaised();
    }
}
