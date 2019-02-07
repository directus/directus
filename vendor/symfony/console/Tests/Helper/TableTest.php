<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Console\Tests\Helper;

use PHPUnit\Framework\TestCase;
use Symfony\Component\Console\Formatter\OutputFormatter;
use Symfony\Component\Console\Helper\Table;
use Symfony\Component\Console\Helper\TableCell;
use Symfony\Component\Console\Helper\TableSeparator;
use Symfony\Component\Console\Helper\TableStyle;
use Symfony\Component\Console\Output\ConsoleSectionOutput;
use Symfony\Component\Console\Output\StreamOutput;

class TableTest extends TestCase
{
    protected $stream;

    protected function setUp()
    {
        $this->stream = fopen('php://memory', 'r+');
    }

    protected function tearDown()
    {
        fclose($this->stream);
        $this->stream = null;
    }

    /**
     * @dataProvider renderProvider
     */
    public function testRender($headers, $rows, $style, $expected, $decorated = false)
    {
        $table = new Table($output = $this->getOutputStream($decorated));
        $table
            ->setHeaders($headers)
            ->setRows($rows)
            ->setStyle($style)
        ;
        $table->render();

        $this->assertEquals($expected, $this->getOutputContent($output));
    }

    /**
     * @dataProvider renderProvider
     */
    public function testRenderAddRows($headers, $rows, $style, $expected, $decorated = false)
    {
        $table = new Table($output = $this->getOutputStream($decorated));
        $table
            ->setHeaders($headers)
            ->addRows($rows)
            ->setStyle($style)
        ;
        $table->render();

        $this->assertEquals($expected, $this->getOutputContent($output));
    }

    /**
     * @dataProvider renderProvider
     */
    public function testRenderAddRowsOneByOne($headers, $rows, $style, $expected, $decorated = false)
    {
        $table = new Table($output = $this->getOutputStream($decorated));
        $table
            ->setHeaders($headers)
            ->setStyle($style)
        ;
        foreach ($rows as $row) {
            $table->addRow($row);
        }
        $table->render();

        $this->assertEquals($expected, $this->getOutputContent($output));
    }

    public function renderProvider()
    {
        $books = [
            ['99921-58-10-7', 'Divine Comedy', 'Dante Alighieri'],
            ['9971-5-0210-0', 'A Tale of Two Cities', 'Charles Dickens'],
            ['960-425-059-0', 'The Lord of the Rings', 'J. R. R. Tolkien'],
            ['80-902734-1-6', 'And Then There Were None', 'Agatha Christie'],
        ];

        return [
            [
                ['ISBN', 'Title', 'Author'],
                $books,
                'default',
<<<'TABLE'
+---------------+--------------------------+------------------+
| ISBN          | Title                    | Author           |
+---------------+--------------------------+------------------+
| 99921-58-10-7 | Divine Comedy            | Dante Alighieri  |
| 9971-5-0210-0 | A Tale of Two Cities     | Charles Dickens  |
| 960-425-059-0 | The Lord of the Rings    | J. R. R. Tolkien |
| 80-902734-1-6 | And Then There Were None | Agatha Christie  |
+---------------+--------------------------+------------------+

TABLE
            ],
            [
                ['ISBN', 'Title', 'Author'],
                $books,
                'compact',
<<<'TABLE'
 ISBN          Title                    Author           
 99921-58-10-7 Divine Comedy            Dante Alighieri  
 9971-5-0210-0 A Tale of Two Cities     Charles Dickens  
 960-425-059-0 The Lord of the Rings    J. R. R. Tolkien 
 80-902734-1-6 And Then There Were None Agatha Christie  

TABLE
            ],
            [
                ['ISBN', 'Title', 'Author'],
                $books,
                'borderless',
<<<'TABLE'
 =============== ========================== ================== 
  ISBN            Title                      Author            
 =============== ========================== ================== 
  99921-58-10-7   Divine Comedy              Dante Alighieri   
  9971-5-0210-0   A Tale of Two Cities       Charles Dickens   
  960-425-059-0   The Lord of the Rings      J. R. R. Tolkien  
  80-902734-1-6   And Then There Were None   Agatha Christie   
 =============== ========================== ================== 

TABLE
            ],
            [
                ['ISBN', 'Title', 'Author'],
                $books,
                'box',
                <<<'TABLE'
┌───────────────┬──────────────────────────┬──────────────────┐
│ ISBN          │ Title                    │ Author           │
├───────────────┼──────────────────────────┼──────────────────┤
│ 99921-58-10-7 │ Divine Comedy            │ Dante Alighieri  │
│ 9971-5-0210-0 │ A Tale of Two Cities     │ Charles Dickens  │
│ 960-425-059-0 │ The Lord of the Rings    │ J. R. R. Tolkien │
│ 80-902734-1-6 │ And Then There Were None │ Agatha Christie  │
└───────────────┴──────────────────────────┴──────────────────┘

TABLE
            ],
            [
                ['ISBN', 'Title', 'Author'],
                [
                    ['99921-58-10-7', 'Divine Comedy', 'Dante Alighieri'],
                    ['9971-5-0210-0', 'A Tale of Two Cities', 'Charles Dickens'],
                    new TableSeparator(),
                    ['960-425-059-0', 'The Lord of the Rings', 'J. R. R. Tolkien'],
                    ['80-902734-1-6', 'And Then There Were None', 'Agatha Christie'],
                ],
                'box-double',
                <<<'TABLE'
╔═══════════════╤══════════════════════════╤══════════════════╗
║ ISBN          │ Title                    │ Author           ║
╠═══════════════╪══════════════════════════╪══════════════════╣
║ 99921-58-10-7 │ Divine Comedy            │ Dante Alighieri  ║
║ 9971-5-0210-0 │ A Tale of Two Cities     │ Charles Dickens  ║
╟───────────────┼──────────────────────────┼──────────────────╢
║ 960-425-059-0 │ The Lord of the Rings    │ J. R. R. Tolkien ║
║ 80-902734-1-6 │ And Then There Were None │ Agatha Christie  ║
╚═══════════════╧══════════════════════════╧══════════════════╝

TABLE
            ],
            [
                ['ISBN', 'Title'],
                [
                    ['99921-58-10-7', 'Divine Comedy', 'Dante Alighieri'],
                    ['9971-5-0210-0'],
                    ['960-425-059-0', 'The Lord of the Rings', 'J. R. R. Tolkien'],
                    ['80-902734-1-6', 'And Then There Were None', 'Agatha Christie'],
                ],
                'default',
<<<'TABLE'
+---------------+--------------------------+------------------+
| ISBN          | Title                    |                  |
+---------------+--------------------------+------------------+
| 99921-58-10-7 | Divine Comedy            | Dante Alighieri  |
| 9971-5-0210-0 |                          |                  |
| 960-425-059-0 | The Lord of the Rings    | J. R. R. Tolkien |
| 80-902734-1-6 | And Then There Were None | Agatha Christie  |
+---------------+--------------------------+------------------+

TABLE
            ],
            [
                [],
                [
                    ['99921-58-10-7', 'Divine Comedy', 'Dante Alighieri'],
                    ['9971-5-0210-0'],
                    ['960-425-059-0', 'The Lord of the Rings', 'J. R. R. Tolkien'],
                    ['80-902734-1-6', 'And Then There Were None', 'Agatha Christie'],
                ],
                'default',
<<<'TABLE'
+---------------+--------------------------+------------------+
| 99921-58-10-7 | Divine Comedy            | Dante Alighieri  |
| 9971-5-0210-0 |                          |                  |
| 960-425-059-0 | The Lord of the Rings    | J. R. R. Tolkien |
| 80-902734-1-6 | And Then There Were None | Agatha Christie  |
+---------------+--------------------------+------------------+

TABLE
            ],
            [
                ['ISBN', 'Title', 'Author'],
                [
                    ['99921-58-10-7', "Divine\nComedy", 'Dante Alighieri'],
                    ['9971-5-0210-2', "Harry Potter\nand the Chamber of Secrets", "Rowling\nJoanne K."],
                    ['9971-5-0210-2', "Harry Potter\nand the Chamber of Secrets", "Rowling\nJoanne K."],
                    ['960-425-059-0', 'The Lord of the Rings', "J. R. R.\nTolkien"],
                ],
                'default',
<<<'TABLE'
+---------------+----------------------------+-----------------+
| ISBN          | Title                      | Author          |
+---------------+----------------------------+-----------------+
| 99921-58-10-7 | Divine                     | Dante Alighieri |
|               | Comedy                     |                 |
| 9971-5-0210-2 | Harry Potter               | Rowling         |
|               | and the Chamber of Secrets | Joanne K.       |
| 9971-5-0210-2 | Harry Potter               | Rowling         |
|               | and the Chamber of Secrets | Joanne K.       |
| 960-425-059-0 | The Lord of the Rings      | J. R. R.        |
|               |                            | Tolkien         |
+---------------+----------------------------+-----------------+

TABLE
            ],
            [
                ['ISBN', 'Title'],
                [],
                'default',
<<<'TABLE'
+------+-------+
| ISBN | Title |
+------+-------+

TABLE
            ],
            [
                [],
                [],
                'default',
                '',
            ],
            'Cell text with tags used for Output styling' => [
                ['ISBN', 'Title', 'Author'],
                [
                    ['<info>99921-58-10-7</info>', '<error>Divine Comedy</error>', '<fg=blue;bg=white>Dante Alighieri</fg=blue;bg=white>'],
                    ['9971-5-0210-0', 'A Tale of Two Cities', '<info>Charles Dickens</>'],
                ],
                'default',
<<<'TABLE'
+---------------+----------------------+-----------------+
| ISBN          | Title                | Author          |
+---------------+----------------------+-----------------+
| 99921-58-10-7 | Divine Comedy        | Dante Alighieri |
| 9971-5-0210-0 | A Tale of Two Cities | Charles Dickens |
+---------------+----------------------+-----------------+

TABLE
            ],
            'Cell text with tags not used for Output styling' => [
                ['ISBN', 'Title', 'Author'],
                [
                    ['<strong>99921-58-10-700</strong>', '<f>Divine Com</f>', 'Dante Alighieri'],
                    ['9971-5-0210-0', 'A Tale of Two Cities', 'Charles Dickens'],
                ],
                'default',
<<<'TABLE'
+----------------------------------+----------------------+-----------------+
| ISBN                             | Title                | Author          |
+----------------------------------+----------------------+-----------------+
| <strong>99921-58-10-700</strong> | <f>Divine Com</f>    | Dante Alighieri |
| 9971-5-0210-0                    | A Tale of Two Cities | Charles Dickens |
+----------------------------------+----------------------+-----------------+

TABLE
            ],
            'Cell with colspan' => [
                ['ISBN', 'Title', 'Author'],
                [
                    ['99921-58-10-7', 'Divine Comedy', 'Dante Alighieri'],
                    new TableSeparator(),
                    [new TableCell('Divine Comedy(Dante Alighieri)', ['colspan' => 3])],
                    new TableSeparator(),
                    [
                        new TableCell('Arduino: A Quick-Start Guide', ['colspan' => 2]),
                        'Mark Schmidt',
                    ],
                    new TableSeparator(),
                    [
                        '9971-5-0210-0',
                        new TableCell("A Tale of \nTwo Cities", ['colspan' => 2]),
                    ],
                    new TableSeparator(),
                    [
                        new TableCell('Cupiditate dicta atque porro, tempora exercitationem modi animi nulla nemo vel nihil!', ['colspan' => 3]),
                    ],
                ],
                'default',
<<<'TABLE'
+-------------------------------+-------------------------------+-----------------------------+
| ISBN                          | Title                         | Author                      |
+-------------------------------+-------------------------------+-----------------------------+
| 99921-58-10-7                 | Divine Comedy                 | Dante Alighieri             |
+-------------------------------+-------------------------------+-----------------------------+
| Divine Comedy(Dante Alighieri)                                                              |
+-------------------------------+-------------------------------+-----------------------------+
| Arduino: A Quick-Start Guide                                  | Mark Schmidt                |
+-------------------------------+-------------------------------+-----------------------------+
| 9971-5-0210-0                 | A Tale of                                                   |
|                               | Two Cities                                                  |
+-------------------------------+-------------------------------+-----------------------------+
| Cupiditate dicta atque porro, tempora exercitationem modi animi nulla nemo vel nihil!       |
+-------------------------------+-------------------------------+-----------------------------+

TABLE
            ],
            'Cell with rowspan' => [
                ['ISBN', 'Title', 'Author'],
                [
                    [
                        new TableCell('9971-5-0210-0', ['rowspan' => 3]),
                        new TableCell('Divine Comedy', ['rowspan' => 2]),
                        'Dante Alighieri',
                    ],
                    [],
                    ["The Lord of \nthe Rings", "J. R. \nR. Tolkien"],
                    new TableSeparator(),
                    ['80-902734-1-6', new TableCell("And Then \nThere \nWere None", ['rowspan' => 3]), 'Agatha Christie'],
                    ['80-902734-1-7', 'Test'],
                ],
                'default',
<<<'TABLE'
+---------------+---------------+-----------------+
| ISBN          | Title         | Author          |
+---------------+---------------+-----------------+
| 9971-5-0210-0 | Divine Comedy | Dante Alighieri |
|               |               |                 |
|               | The Lord of   | J. R.           |
|               | the Rings     | R. Tolkien      |
+---------------+---------------+-----------------+
| 80-902734-1-6 | And Then      | Agatha Christie |
| 80-902734-1-7 | There         | Test            |
|               | Were None     |                 |
+---------------+---------------+-----------------+

TABLE
            ],
            'Cell with rowspan and colspan' => [
                ['ISBN', 'Title', 'Author'],
                [
                    [
                        new TableCell('9971-5-0210-0', ['rowspan' => 2, 'colspan' => 2]),
                        'Dante Alighieri',
                    ],
                    ['Charles Dickens'],
                    new TableSeparator(),
                    [
                        'Dante Alighieri',
                        new TableCell('9971-5-0210-0', ['rowspan' => 3, 'colspan' => 2]),
                    ],
                    ['J. R. R. Tolkien'],
                    ['J. R. R'],
                ],
                'default',
<<<'TABLE'
+------------------+---------+-----------------+
| ISBN             | Title   | Author          |
+------------------+---------+-----------------+
| 9971-5-0210-0              | Dante Alighieri |
|                            | Charles Dickens |
+------------------+---------+-----------------+
| Dante Alighieri  | 9971-5-0210-0             |
| J. R. R. Tolkien |                           |
| J. R. R          |                           |
+------------------+---------+-----------------+

TABLE
            ],
            'Cell with rowspan and colspan contains new line break' => [
                ['ISBN', 'Title', 'Author'],
                [
                    [
                        new TableCell("9971\n-5-\n021\n0-0", ['rowspan' => 2, 'colspan' => 2]),
                        'Dante Alighieri',
                    ],
                    ['Charles Dickens'],
                    new TableSeparator(),
                    [
                        'Dante Alighieri',
                        new TableCell("9971\n-5-\n021\n0-0", ['rowspan' => 2, 'colspan' => 2]),
                    ],
                    ['Charles Dickens'],
                    new TableSeparator(),
                    [
                        new TableCell("9971\n-5-\n021\n0-0", ['rowspan' => 2, 'colspan' => 2]),
                        new TableCell("Dante \nAlighieri", ['rowspan' => 2, 'colspan' => 1]),
                    ],
                ],
                'default',
<<<'TABLE'
+-----------------+-------+-----------------+
| ISBN            | Title | Author          |
+-----------------+-------+-----------------+
| 9971                    | Dante Alighieri |
| -5-                     | Charles Dickens |
| 021                     |                 |
| 0-0                     |                 |
+-----------------+-------+-----------------+
| Dante Alighieri | 9971                    |
| Charles Dickens | -5-                     |
|                 | 021                     |
|                 | 0-0                     |
+-----------------+-------+-----------------+
| 9971                    | Dante           |
| -5-                     | Alighieri       |
| 021                     |                 |
| 0-0                     |                 |
+-----------------+-------+-----------------+

TABLE
            ],
            'Cell with rowspan and colspan without using TableSeparator' => [
                ['ISBN', 'Title', 'Author'],
                [
                    [
                        new TableCell("9971\n-5-\n021\n0-0", ['rowspan' => 2, 'colspan' => 2]),
                        'Dante Alighieri',
                    ],
                    ['Charles Dickens'],
                    [
                        'Dante Alighieri',
                        new TableCell("9971\n-5-\n021\n0-0", ['rowspan' => 2, 'colspan' => 2]),
                    ],
                    ['Charles Dickens'],
                ],
                'default',
<<<'TABLE'
+-----------------+-------+-----------------+
| ISBN            | Title | Author          |
+-----------------+-------+-----------------+
| 9971                    | Dante Alighieri |
| -5-                     | Charles Dickens |
| 021                     |                 |
| 0-0                     |                 |
| Dante Alighieri | 9971                    |
| Charles Dickens | -5-                     |
|                 | 021                     |
|                 | 0-0                     |
+-----------------+-------+-----------------+

TABLE
            ],
            'Cell with rowspan and colspan with separator inside a rowspan' => [
                ['ISBN', 'Author'],
                [
                    [
                        new TableCell('9971-5-0210-0', ['rowspan' => 3, 'colspan' => 1]),
                        'Dante Alighieri',
                    ],
                    [new TableSeparator()],
                    ['Charles Dickens'],
                ],
                'default',
<<<'TABLE'
+---------------+-----------------+
| ISBN          | Author          |
+---------------+-----------------+
| 9971-5-0210-0 | Dante Alighieri |
|               |-----------------|
|               | Charles Dickens |
+---------------+-----------------+

TABLE
            ],
            'Multiple header lines' => [
                [
                    [new TableCell('Main title', ['colspan' => 3])],
                    ['ISBN', 'Title', 'Author'],
                ],
                [],
                'default',
<<<'TABLE'
+------+-------+--------+
| Main title            |
+------+-------+--------+
| ISBN | Title | Author |
+------+-------+--------+

TABLE
            ],
            'Row with multiple cells' => [
                [],
                [
                    [
                        new TableCell('1', ['colspan' => 3]),
                        new TableCell('2', ['colspan' => 2]),
                        new TableCell('3', ['colspan' => 2]),
                        new TableCell('4', ['colspan' => 2]),
                    ],
        ],
                'default',
<<<'TABLE'
+---+--+--+---+--+---+--+---+--+
| 1       | 2    | 3    | 4    |
+---+--+--+---+--+---+--+---+--+

TABLE
            ],
            'Coslpan and table cells with comment style' => [
                [
                    new TableCell('<comment>Long Title</comment>', ['colspan' => 3]),
                ],
                [
                    [
                        new TableCell('9971-5-0210-0', ['colspan' => 3]),
                    ],
                    new TableSeparator(),
                    [
                        'Dante Alighieri',
                        'J. R. R. Tolkien',
                        'J. R. R',
                    ],
                ],
                'default',
                <<<TABLE
+-----------------+------------------+---------+
|\033[32m \033[39m\033[33mLong Title\033[39m\033[32m                                   \033[39m|
+-----------------+------------------+---------+
| 9971-5-0210-0                                |
+-----------------+------------------+---------+
| Dante Alighieri | J. R. R. Tolkien | J. R. R |
+-----------------+------------------+---------+

TABLE
            ,
                true,
            ],
            'Row with formatted cells containing a newline' => [
                [],
                [
                    [
                        new TableCell('<error>Dont break'."\n".'here</error>', ['colspan' => 2]),
                    ],
                    new TableSeparator(),
                    [
                        'foo',
                         new TableCell('<error>Dont break'."\n".'here</error>', ['rowspan' => 2]),
                    ],
                    [
                        'bar',
                    ],
                ],
                'default',
                <<<'TABLE'
+-------+------------+
[39;49m| [39;49m[37;41mDont break[39;49m[39;49m         |[39;49m
[39;49m| [39;49m[37;41mhere[39;49m               |
+-------+------------+
[39;49m| foo   | [39;49m[37;41mDont break[39;49m[39;49m |[39;49m
[39;49m| bar   | [39;49m[37;41mhere[39;49m       |
+-------+------------+

TABLE
            ,
                true,
            ],
        ];
    }

    public function testRenderMultiByte()
    {
        $table = new Table($output = $this->getOutputStream());
        $table
            ->setHeaders(['■■'])
            ->setRows([[1234]])
            ->setStyle('default')
        ;
        $table->render();

        $expected =
<<<'TABLE'
+------+
| ■■   |
+------+
| 1234 |
+------+

TABLE;

        $this->assertEquals($expected, $this->getOutputContent($output));
    }

    public function testTableCellWithNumericIntValue()
    {
        $table = new Table($output = $this->getOutputStream());

        $table->setRows([[new TableCell(12345)]]);
        $table->render();

        $expected =
<<<'TABLE'
+-------+
| 12345 |
+-------+

TABLE;

        $this->assertEquals($expected, $this->getOutputContent($output));
    }

    public function testTableCellWithNumericFloatValue()
    {
        $table = new Table($output = $this->getOutputStream());

        $table->setRows([[new TableCell(12345.01)]]);
        $table->render();

        $expected =
<<<'TABLE'
+----------+
| 12345.01 |
+----------+

TABLE;

        $this->assertEquals($expected, $this->getOutputContent($output));
    }

    public function testStyle()
    {
        $style = new TableStyle();
        $style
            ->setHorizontalBorderChars('.')
            ->setVerticalBorderChars('.')
            ->setDefaultCrossingChar('.')
        ;

        Table::setStyleDefinition('dotfull', $style);
        $table = new Table($output = $this->getOutputStream());
        $table
            ->setHeaders(['Foo'])
            ->setRows([['Bar']])
            ->setStyle('dotfull');
        $table->render();

        $expected =
<<<'TABLE'
.......
. Foo .
.......
. Bar .
.......

TABLE;

        $this->assertEquals($expected, $this->getOutputContent($output));
    }

    public function testRowSeparator()
    {
        $table = new Table($output = $this->getOutputStream());
        $table
            ->setHeaders(['Foo'])
            ->setRows([
                ['Bar1'],
                new TableSeparator(),
                ['Bar2'],
                new TableSeparator(),
                ['Bar3'],
            ]);
        $table->render();

        $expected =
<<<'TABLE'
+------+
| Foo  |
+------+
| Bar1 |
+------+
| Bar2 |
+------+
| Bar3 |
+------+

TABLE;

        $this->assertEquals($expected, $this->getOutputContent($output));

        $this->assertEquals($table, $table->addRow(new TableSeparator()), 'fluent interface on addRow() with a single TableSeparator() works');
    }

    public function testRenderMultiCalls()
    {
        $table = new Table($output = $this->getOutputStream());
        $table->setRows([
            [new TableCell('foo', ['colspan' => 2])],
        ]);
        $table->render();
        $table->render();
        $table->render();

        $expected =
<<<TABLE
+----+---+
| foo    |
+----+---+
+----+---+
| foo    |
+----+---+
+----+---+
| foo    |
+----+---+

TABLE;

        $this->assertEquals($expected, $this->getOutputContent($output));
    }

    public function testColumnStyle()
    {
        $table = new Table($output = $this->getOutputStream());
        $table
            ->setHeaders(['ISBN', 'Title', 'Author', 'Price'])
            ->setRows([
                ['99921-58-10-7', 'Divine Comedy', 'Dante Alighieri', '9.95'],
                ['9971-5-0210-0', 'A Tale of Two Cities', 'Charles Dickens', '139.25'],
            ]);

        $style = new TableStyle();
        $style->setPadType(STR_PAD_LEFT);
        $table->setColumnStyle(3, $style);

        $table->render();

        $expected =
            <<<TABLE
+---------------+----------------------+-----------------+--------+
| ISBN          | Title                | Author          |  Price |
+---------------+----------------------+-----------------+--------+
| 99921-58-10-7 | Divine Comedy        | Dante Alighieri |   9.95 |
| 9971-5-0210-0 | A Tale of Two Cities | Charles Dickens | 139.25 |
+---------------+----------------------+-----------------+--------+

TABLE;

        $this->assertEquals($expected, $this->getOutputContent($output));
    }

    /**
     * @expectedException \Symfony\Component\Console\Exception\InvalidArgumentException
     * @expectedExceptionMessage A cell must be a TableCell, a scalar or an object implementing __toString, array given.
     */
    public function testThrowsWhenTheCellInAnArray()
    {
        $table = new Table($output = $this->getOutputStream());
        $table
            ->setHeaders(['ISBN', 'Title', 'Author', 'Price'])
            ->setRows([
                ['99921-58-10-7', [], 'Dante Alighieri', '9.95'],
            ]);

        $table->render();
    }

    public function testColumnWidth()
    {
        $table = new Table($output = $this->getOutputStream());
        $table
            ->setHeaders(['ISBN', 'Title', 'Author', 'Price'])
            ->setRows([
                ['99921-58-10-7', 'Divine Comedy', 'Dante Alighieri', '9.95'],
                ['9971-5-0210-0', 'A Tale of Two Cities', 'Charles Dickens', '139.25'],
            ])
            ->setColumnWidth(0, 15)
            ->setColumnWidth(3, 10);

        $style = new TableStyle();
        $style->setPadType(STR_PAD_LEFT);
        $table->setColumnStyle(3, $style);

        $table->render();

        $expected =
            <<<TABLE
+-----------------+----------------------+-----------------+------------+
| ISBN            | Title                | Author          |      Price |
+-----------------+----------------------+-----------------+------------+
| 99921-58-10-7   | Divine Comedy        | Dante Alighieri |       9.95 |
| 9971-5-0210-0   | A Tale of Two Cities | Charles Dickens |     139.25 |
+-----------------+----------------------+-----------------+------------+

TABLE;

        $this->assertEquals($expected, $this->getOutputContent($output));
    }

    public function testColumnWidths()
    {
        $table = new Table($output = $this->getOutputStream());
        $table
            ->setHeaders(['ISBN', 'Title', 'Author', 'Price'])
            ->setRows([
                ['99921-58-10-7', 'Divine Comedy', 'Dante Alighieri', '9.95'],
                ['9971-5-0210-0', 'A Tale of Two Cities', 'Charles Dickens', '139.25'],
            ])
            ->setColumnWidths([15, 0, -1, 10]);

        $style = new TableStyle();
        $style->setPadType(STR_PAD_LEFT);
        $table->setColumnStyle(3, $style);

        $table->render();

        $expected =
            <<<TABLE
+-----------------+----------------------+-----------------+------------+
| ISBN            | Title                | Author          |      Price |
+-----------------+----------------------+-----------------+------------+
| 99921-58-10-7   | Divine Comedy        | Dante Alighieri |       9.95 |
| 9971-5-0210-0   | A Tale of Two Cities | Charles Dickens |     139.25 |
+-----------------+----------------------+-----------------+------------+

TABLE;

        $this->assertEquals($expected, $this->getOutputContent($output));
    }

    public function testSectionOutput()
    {
        $sections = [];
        $stream = $this->getOutputStream(true);
        $output = new ConsoleSectionOutput($stream->getStream(), $sections, $stream->getVerbosity(), $stream->isDecorated(), new OutputFormatter());
        $table = new Table($output);
        $table
            ->setHeaders(['ISBN', 'Title', 'Author', 'Price'])
            ->setRows([
                ['99921-58-10-7', 'Divine Comedy', 'Dante Alighieri', '9.95'],
            ]);

        $table->render();

        $table->appendRow(['9971-5-0210-0', 'A Tale of Two Cities', 'Charles Dickens', '139.25']);

        $expected =
            <<<TABLE
+---------------+---------------+-----------------+-------+
|\033[32m ISBN          \033[39m|\033[32m Title         \033[39m|\033[32m Author          \033[39m|\033[32m Price \033[39m|
+---------------+---------------+-----------------+-------+
| 99921-58-10-7 | Divine Comedy | Dante Alighieri | 9.95  |
+---------------+---------------+-----------------+-------+
\x1b[5A\x1b[0J+---------------+----------------------+-----------------+--------+
|\033[32m ISBN          \033[39m|\033[32m Title                \033[39m|\033[32m Author          \033[39m|\033[32m Price  \033[39m|
+---------------+----------------------+-----------------+--------+
| 99921-58-10-7 | Divine Comedy        | Dante Alighieri | 9.95   |
| 9971-5-0210-0 | A Tale of Two Cities | Charles Dickens | 139.25 |
+---------------+----------------------+-----------------+--------+

TABLE;

        $this->assertEquals($expected, $this->getOutputContent($output));
    }

    public function testSectionOutputDoesntClearIfTableIsntRendered()
    {
        $sections = [];
        $stream = $this->getOutputStream(true);
        $output = new ConsoleSectionOutput($stream->getStream(), $sections, $stream->getVerbosity(), $stream->isDecorated(), new OutputFormatter());
        $table = new Table($output);
        $table
            ->setHeaders(['ISBN', 'Title', 'Author', 'Price'])
            ->setRows([
                ['99921-58-10-7', 'Divine Comedy', 'Dante Alighieri', '9.95'],
            ]);

        $table->appendRow(['9971-5-0210-0', 'A Tale of Two Cities', 'Charles Dickens', '139.25']);

        $expected =
            <<<TABLE
+---------------+----------------------+-----------------+--------+
|\033[32m ISBN          \033[39m|\033[32m Title                \033[39m|\033[32m Author          \033[39m|\033[32m Price  \033[39m|
+---------------+----------------------+-----------------+--------+
| 99921-58-10-7 | Divine Comedy        | Dante Alighieri | 9.95   |
| 9971-5-0210-0 | A Tale of Two Cities | Charles Dickens | 139.25 |
+---------------+----------------------+-----------------+--------+

TABLE;

        $this->assertEquals($expected, $this->getOutputContent($output));
    }

    public function testSectionOutputWithoutDecoration()
    {
        $sections = [];
        $stream = $this->getOutputStream();
        $output = new ConsoleSectionOutput($stream->getStream(), $sections, $stream->getVerbosity(), $stream->isDecorated(), new OutputFormatter());
        $table = new Table($output);
        $table
            ->setHeaders(['ISBN', 'Title', 'Author', 'Price'])
            ->setRows([
                ['99921-58-10-7', 'Divine Comedy', 'Dante Alighieri', '9.95'],
            ]);

        $table->render();

        $table->appendRow(['9971-5-0210-0', 'A Tale of Two Cities', 'Charles Dickens', '139.25']);

        $expected =
            <<<TABLE
+---------------+---------------+-----------------+-------+
| ISBN          | Title         | Author          | Price |
+---------------+---------------+-----------------+-------+
| 99921-58-10-7 | Divine Comedy | Dante Alighieri | 9.95  |
+---------------+---------------+-----------------+-------+
+---------------+----------------------+-----------------+--------+
| ISBN          | Title                | Author          | Price  |
+---------------+----------------------+-----------------+--------+
| 99921-58-10-7 | Divine Comedy        | Dante Alighieri | 9.95   |
| 9971-5-0210-0 | A Tale of Two Cities | Charles Dickens | 139.25 |
+---------------+----------------------+-----------------+--------+

TABLE;

        $this->assertEquals($expected, $this->getOutputContent($output));
    }

    /**
     * @expectedException \Symfony\Component\Console\Exception\RuntimeException
     * @expectedExceptionMessage Output should be an instance of "Symfony\Component\Console\Output\ConsoleSectionOutput" when calling "Symfony\Component\Console\Helper\Table::appendRow".
     */
    public function testAppendRowWithoutSectionOutput()
    {
        $table = new Table($this->getOutputStream());

        $table->appendRow(['9971-5-0210-0', 'A Tale of Two Cities', 'Charles Dickens', '139.25']);
    }

    /**
     * @expectedException \Symfony\Component\Console\Exception\InvalidArgumentException
     * @expectedExceptionMessage Style "absent" is not defined.
     */
    public function testIsNotDefinedStyleException()
    {
        $table = new Table($this->getOutputStream());
        $table->setStyle('absent');
    }

    /**
     * @expectedException \Symfony\Component\Console\Exception\InvalidArgumentException
     * @expectedExceptionMessage Style "absent" is not defined.
     */
    public function testGetStyleDefinition()
    {
        Table::getStyleDefinition('absent');
    }

    /**
     * @dataProvider renderSetTitle
     */
    public function testSetTitle($headerTitle, $footerTitle, $style, $expected)
    {
        (new Table($output = $this->getOutputStream()))
            ->setHeaderTitle($headerTitle)
            ->setFooterTitle($footerTitle)
            ->setHeaders(['ISBN', 'Title', 'Author'])
            ->setRows([
                ['99921-58-10-7', 'Divine Comedy', 'Dante Alighieri'],
                ['9971-5-0210-0', 'A Tale of Two Cities', 'Charles Dickens'],
                ['960-425-059-0', 'The Lord of the Rings', 'J. R. R. Tolkien'],
                ['80-902734-1-6', 'And Then There Were None', 'Agatha Christie'],
            ])
            ->setStyle($style)
            ->render()
        ;

        $this->assertEquals($expected, $this->getOutputContent($output));
    }

    public function renderSetTitle()
    {
        return [
            [
                'Books',
                'Page 1/2',
                'default',
                <<<'TABLE'
+---------------+----------- Books --------+------------------+
| ISBN          | Title                    | Author           |
+---------------+--------------------------+------------------+
| 99921-58-10-7 | Divine Comedy            | Dante Alighieri  |
| 9971-5-0210-0 | A Tale of Two Cities     | Charles Dickens  |
| 960-425-059-0 | The Lord of the Rings    | J. R. R. Tolkien |
| 80-902734-1-6 | And Then There Were None | Agatha Christie  |
+---------------+--------- Page 1/2 -------+------------------+

TABLE
            ],
            [
                'Books',
                'Page 1/2',
                'box',
                <<<'TABLE'
┌───────────────┬─────────── Books ────────┬──────────────────┐
│ ISBN          │ Title                    │ Author           │
├───────────────┼──────────────────────────┼──────────────────┤
│ 99921-58-10-7 │ Divine Comedy            │ Dante Alighieri  │
│ 9971-5-0210-0 │ A Tale of Two Cities     │ Charles Dickens  │
│ 960-425-059-0 │ The Lord of the Rings    │ J. R. R. Tolkien │
│ 80-902734-1-6 │ And Then There Were None │ Agatha Christie  │
└───────────────┴───────── Page 1/2 ───────┴──────────────────┘

TABLE
            ],
            [
                'Boooooooooooooooooooooooooooooooooooooooooooooooooooooooks',
                'Page 1/999999999999999999999999999999999999999999999999999',
                'default',
                <<<'TABLE'
+- Booooooooooooooooooooooooooooooooooooooooooooooooooooo... -+
| ISBN          | Title                    | Author           |
+---------------+--------------------------+------------------+
| 99921-58-10-7 | Divine Comedy            | Dante Alighieri  |
| 9971-5-0210-0 | A Tale of Two Cities     | Charles Dickens  |
| 960-425-059-0 | The Lord of the Rings    | J. R. R. Tolkien |
| 80-902734-1-6 | And Then There Were None | Agatha Christie  |
+- Page 1/99999999999999999999999999999999999999999999999... -+

TABLE
            ],
        ];
    }

    public function testColumnMaxWidths()
    {
        $table = new Table($output = $this->getOutputStream());
        $table
            ->setRows([
                ['Divine Comedy', 'A Tale of Two Cities', 'The Lord of the Rings', 'And Then There Were None'],
            ])
            ->setColumnMaxWidth(1, 5)
            ->setColumnMaxWidth(2, 10)
            ->setColumnMaxWidth(3, 15);

        $table->render();

        $expected =
            <<<TABLE
+---------------+-------+------------+-----------------+
| Divine Comedy | A Tal | The Lord o | And Then There  |
|               | e of  | f the Ring | Were None       |
|               | Two C | s          |                 |
|               | ities |            |                 |
+---------------+-------+------------+-----------------+

TABLE;

        $this->assertEquals($expected, $this->getOutputContent($output));
    }

    public function testBoxedStyleWithColspan()
    {
        $boxed = new TableStyle();
        $boxed
            ->setHorizontalBorderChars('─')
            ->setVerticalBorderChars('│')
            ->setCrossingChars('┼', '┌', '┬', '┐', '┤', '┘', '┴', '└', '├')
        ;

        $table = new Table($output = $this->getOutputStream());
        $table->setStyle($boxed);
        $table
            ->setHeaders(['ISBN', 'Title', 'Author'])
            ->setRows([
                ['99921-58-10-7', 'Divine Comedy', 'Dante Alighieri'],
                new TableSeparator(),
                [new TableCell('This value spans 3 columns.', ['colspan' => 3])],
            ])
        ;
        $table->render();

        $expected =
            <<<TABLE
┌───────────────┬───────────────┬─────────────────┐
│ ISBN          │ Title         │ Author          │
├───────────────┼───────────────┼─────────────────┤
│ 99921-58-10-7 │ Divine Comedy │ Dante Alighieri │
├───────────────┼───────────────┼─────────────────┤
│ This value spans 3 columns.                     │
└───────────────┴───────────────┴─────────────────┘

TABLE;

        $this->assertSame($expected, $this->getOutputContent($output));
    }

    protected function getOutputStream($decorated = false)
    {
        return new StreamOutput($this->stream, StreamOutput::VERBOSITY_NORMAL, $decorated);
    }

    protected function getOutputContent(StreamOutput $output)
    {
        rewind($output->getStream());

        return str_replace(PHP_EOL, "\n", stream_get_contents($output->getStream()));
    }
}
