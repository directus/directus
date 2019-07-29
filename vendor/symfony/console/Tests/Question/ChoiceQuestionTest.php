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
use Symfony\Component\Console\Question\ChoiceQuestion;

class ChoiceQuestionTest extends TestCase
{
    /**
     * @dataProvider selectUseCases
     */
    public function testSelectUseCases($multiSelect, $answers, $expected, $message)
    {
        $question = new ChoiceQuestion('A question', [
            'First response',
            'Second response',
            'Third response',
            'Fourth response',
        ]);

        $question->setMultiselect($multiSelect);

        foreach ($answers as $answer) {
            $validator = $question->getValidator();
            $actual = $validator($answer);

            $this->assertEquals($actual, $expected, $message);
        }
    }

    public function selectUseCases()
    {
        return [
            [
                false,
                ['First response', 'First response ', ' First response', ' First response '],
                'First response',
                'When passed single answer on singleSelect, the defaultValidator must return this answer as a string',
            ],
            [
                true,
                ['First response', 'First response ', ' First response', ' First response '],
                ['First response'],
                'When passed single answer on MultiSelect, the defaultValidator must return this answer as an array',
            ],
            [
                true,
                ['First response,Second response', ' First response , Second response '],
                ['First response', 'Second response'],
                'When passed multiple answers on MultiSelect, the defaultValidator must return these answers as an array',
            ],
        ];
    }
}
