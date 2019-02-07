<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Console\Tests\Question;

use PHPUnit\Framework\TestCase;
use Symfony\Component\Console\Question\ConfirmationQuestion;

class ConfirmationQuestionTest extends TestCase
{
    /**
     * @dataProvider normalizerUsecases
     */
    public function testDefaultRegexUsecases($default, $answers, $expected, $message)
    {
        $sut = new ConfirmationQuestion('A question', $default);

        foreach ($answers as $answer) {
            $normalizer = $sut->getNormalizer();
            $actual = $normalizer($answer);
            $this->assertEquals($expected, $actual, sprintf($message, $answer));
        }
    }

    public function normalizerUsecases()
    {
        return [
            [
                true,
                ['y', 'Y', 'yes', 'YES', 'yEs', ''],
                true,
                'When default is true, the normalizer must return true for "%s"',
            ],
            [
                true,
                ['n', 'N', 'no', 'NO', 'nO', 'foo', '1', '0'],
                false,
                'When default is true, the normalizer must return false for "%s"',
            ],
            [
                false,
                ['y', 'Y', 'yes', 'YES', 'yEs'],
                true,
                'When default is false, the normalizer must return true for "%s"',
            ],
            [
                false,
                ['n', 'N', 'no', 'NO', 'nO', 'foo', '1', '0', ''],
                false,
                'When default is false, the normalizer must return false for "%s"',
            ],
        ];
    }
}
