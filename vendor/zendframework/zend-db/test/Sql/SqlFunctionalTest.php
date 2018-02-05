<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Sql;

use PHPUnit\Framework\TestCase;
use Zend\Db\Adapter;
use Zend\Db\Sql;
use ZendTest\Db\TestAsset;

/**
 * @method \Zend\Db\Sql\Select select(null|string $table)
 * @method \Zend\Db\Sql\Update update(null|string $table)
 * @method \Zend\Db\Sql\Delete delete(null|string $table)
 * @method \Zend\Db\Sql\Insert insert(null|string $table)
 * @method \Zend\Db\Sql\Ddl\CreateTable createTable(null|string $table)
 * @method \Zend\Db\Sql\Ddl\Column\Column createColumn(null|string $name)
 */
class SqlFunctionalTest extends TestCase
{
    protected function dataProviderCommonProcessMethods()
    {
        return [
            'Select::processOffset()' => [
                'sqlObject' => $this->select('foo')->offset(10),
                'expected'  => [
                    'sql92' => [
                        'string'     => 'SELECT "foo".* FROM "foo" OFFSET \'10\'',
                        'prepare'    => 'SELECT "foo".* FROM "foo" OFFSET ?',
                        'parameters' => ['offset' => 10],
                    ],
                    'MySql' => [
                        'string'     => 'SELECT `foo`.* FROM `foo` LIMIT 18446744073709551615 OFFSET 10',
                        'prepare'    => 'SELECT `foo`.* FROM `foo` LIMIT 18446744073709551615 OFFSET ?',
                        'parameters' => ['offset' => 10],
                    ],
                    // @codingStandardsIgnoreStart
                    'Oracle' => [
                        'string'     => 'SELECT * FROM (SELECT b.*, rownum b_rownum FROM ( SELECT "foo".* FROM "foo" ) b ) WHERE b_rownum > (10)',
                        'prepare'    => 'SELECT * FROM (SELECT b.*, rownum b_rownum FROM ( SELECT "foo".* FROM "foo" ) b ) WHERE b_rownum > (:offset)',
                        'parameters' => ['offset' => 10],
                    ],
                    'SqlServer' => [
                        'string'     => 'SELECT * FROM ( SELECT [foo].*, ROW_NUMBER() OVER (ORDER BY (SELECT 1)) AS [__ZEND_ROW_NUMBER] FROM [foo] ) AS [ZEND_SQL_SERVER_LIMIT_OFFSET_EMULATION] WHERE [ZEND_SQL_SERVER_LIMIT_OFFSET_EMULATION].[__ZEND_ROW_NUMBER] BETWEEN 10+1 AND 0+10',
                        'prepare'    => 'SELECT * FROM ( SELECT [foo].*, ROW_NUMBER() OVER (ORDER BY (SELECT 1)) AS [__ZEND_ROW_NUMBER] FROM [foo] ) AS [ZEND_SQL_SERVER_LIMIT_OFFSET_EMULATION] WHERE [ZEND_SQL_SERVER_LIMIT_OFFSET_EMULATION].[__ZEND_ROW_NUMBER] BETWEEN ?+1 AND ?+?',
                        'parameters' => ['offset' => 10, 'limit' => null, 'offsetForSum' => 10],
                    ],
                    // @codingStandardsIgnoreEnd
                ],
            ],
            'Select::processLimit()' => [
                'sqlObject' => $this->select('foo')->limit(10),
                'expected'  => [
                    'sql92' => [
                        'string'     => 'SELECT "foo".* FROM "foo" LIMIT \'10\'',
                        'prepare'    => 'SELECT "foo".* FROM "foo" LIMIT ?',
                        'parameters' => ['limit' => 10],
                    ],
                    'MySql' => [
                        'string'     => 'SELECT `foo`.* FROM `foo` LIMIT 10',
                        'prepare'    => 'SELECT `foo`.* FROM `foo` LIMIT ?',
                        'parameters' => ['limit' => 10],
                    ],
                    // @codingStandardsIgnoreStart
                    'Oracle' => [
                        'string'     => 'SELECT * FROM (SELECT b.*, rownum b_rownum FROM ( SELECT "foo".* FROM "foo" ) b WHERE rownum <= (0+10)) WHERE b_rownum >= (0 + 1)',
                        'prepare'    => 'SELECT * FROM (SELECT b.*, rownum b_rownum FROM ( SELECT "foo".* FROM "foo" ) b WHERE rownum <= (:offset+:limit)) WHERE b_rownum >= (:offset + 1)',
                        'parameters' => ['offset' => 0, 'limit' => 10],
                    ],
                    'SqlServer' => [
                        'string'     => 'SELECT * FROM ( SELECT [foo].*, ROW_NUMBER() OVER (ORDER BY (SELECT 1)) AS [__ZEND_ROW_NUMBER] FROM [foo] ) AS [ZEND_SQL_SERVER_LIMIT_OFFSET_EMULATION] WHERE [ZEND_SQL_SERVER_LIMIT_OFFSET_EMULATION].[__ZEND_ROW_NUMBER] BETWEEN 0+1 AND 10+0',
                        'prepare'    => 'SELECT * FROM ( SELECT [foo].*, ROW_NUMBER() OVER (ORDER BY (SELECT 1)) AS [__ZEND_ROW_NUMBER] FROM [foo] ) AS [ZEND_SQL_SERVER_LIMIT_OFFSET_EMULATION] WHERE [ZEND_SQL_SERVER_LIMIT_OFFSET_EMULATION].[__ZEND_ROW_NUMBER] BETWEEN ?+1 AND ?+?',
                        'parameters' => ['offset' => null, 'limit' => 10, 'offsetForSum' => null],
                    ],
                    // @codingStandardsIgnoreEnd
                ],
            ],
            'Select::processLimitOffset()' => [
                'sqlObject' => $this->select('foo')->limit(10)->offset(5),
                'expected'  => [
                    'sql92' => [
                        'string'     => 'SELECT "foo".* FROM "foo" LIMIT \'10\' OFFSET \'5\'',
                        'prepare'    => 'SELECT "foo".* FROM "foo" LIMIT ? OFFSET ?',
                        'parameters' => ['limit' => 10, 'offset' => 5],
                    ],
                    'MySql' => [
                        'string'     => 'SELECT `foo`.* FROM `foo` LIMIT 10 OFFSET 5',
                        'prepare'    => 'SELECT `foo`.* FROM `foo` LIMIT ? OFFSET ?',
                        'parameters' => ['limit' => 10, 'offset' => 5],
                    ],
                    // @codingStandardsIgnoreStart
                    'Oracle' => [
                        'string'     => 'SELECT * FROM (SELECT b.*, rownum b_rownum FROM ( SELECT "foo".* FROM "foo" ) b WHERE rownum <= (5+10)) WHERE b_rownum >= (5 + 1)',
                        'prepare'    => 'SELECT * FROM (SELECT b.*, rownum b_rownum FROM ( SELECT "foo".* FROM "foo" ) b WHERE rownum <= (:offset+:limit)) WHERE b_rownum >= (:offset + 1)',
                        'parameters' => ['offset' => 5, 'limit' => 10],
                    ],
                    'SqlServer' => [
                        'string'     => 'SELECT * FROM ( SELECT [foo].*, ROW_NUMBER() OVER (ORDER BY (SELECT 1)) AS [__ZEND_ROW_NUMBER] FROM [foo] ) AS [ZEND_SQL_SERVER_LIMIT_OFFSET_EMULATION] WHERE [ZEND_SQL_SERVER_LIMIT_OFFSET_EMULATION].[__ZEND_ROW_NUMBER] BETWEEN 5+1 AND 10+5',
                        'prepare'    => 'SELECT * FROM ( SELECT [foo].*, ROW_NUMBER() OVER (ORDER BY (SELECT 1)) AS [__ZEND_ROW_NUMBER] FROM [foo] ) AS [ZEND_SQL_SERVER_LIMIT_OFFSET_EMULATION] WHERE [ZEND_SQL_SERVER_LIMIT_OFFSET_EMULATION].[__ZEND_ROW_NUMBER] BETWEEN ?+1 AND ?+?',
                        'parameters' => ['offset' => 5, 'limit' => 10, 'offsetForSum' => 5],
                    ],
                    // @codingStandardsIgnoreEnd
                ],
            ],
            // Github issue https://github.com/zendframework/zend-db/issues/98
            'Select::processJoinNoJoinedColumns()' => [
                'sqlObject' => $this->select('my_table')
                                    ->join(
                                        'joined_table2',
                                        'my_table.id = joined_table2.id',
                                        $columns = []
                                    )
                                    ->join(
                                        'joined_table3',
                                        'my_table.id = joined_table3.id',
                                        [\Zend\Db\Sql\Select::SQL_STAR]
                                    )
                                    ->columns([
                                        'my_table_column',
                                        'aliased_column' => new \Zend\Db\Sql\Expression('NOW()'),
                                    ]),
                'expected' => [
                    // @codingStandardsIgnoreStart
                    'sql92' => [
                        'string' => 'SELECT "my_table"."my_table_column" AS "my_table_column", NOW() AS "aliased_column", "joined_table3".* FROM "my_table" INNER JOIN "joined_table2" ON "my_table"."id" = "joined_table2"."id" INNER JOIN "joined_table3" ON "my_table"."id" = "joined_table3"."id"',
                    ],
                    'MySql' => [
                        'string' => 'SELECT `my_table`.`my_table_column` AS `my_table_column`, NOW() AS `aliased_column`, `joined_table3`.* FROM `my_table` INNER JOIN `joined_table2` ON `my_table`.`id` = `joined_table2`.`id` INNER JOIN `joined_table3` ON `my_table`.`id` = `joined_table3`.`id`',
                    ],
                    'Oracle' => [
                        'string' => 'SELECT "my_table"."my_table_column" AS "my_table_column", NOW() AS "aliased_column", "joined_table3".* FROM "my_table" INNER JOIN "joined_table2" ON "my_table"."id" = "joined_table2"."id" INNER JOIN "joined_table3" ON "my_table"."id" = "joined_table3"."id"',
                    ],
                    'SqlServer' => [
                        'string' => 'SELECT [my_table].[my_table_column] AS [my_table_column], NOW() AS [aliased_column], [joined_table3].* FROM [my_table] INNER JOIN [joined_table2] ON [my_table].[id] = [joined_table2].[id] INNER JOIN [joined_table3] ON [my_table].[id] = [joined_table3].[id]',
                    ]
                    // @codingStandardsIgnoreEnd
                ]
            ],
            'Select::processJoin()' => [
                'sqlObject' => $this->select('a')
                                    ->join(['b' => $this->select('c')->where(['cc' => 10])], 'd=e')->where(['x' => 20]),
                'expected'  => [
                    // @codingStandardsIgnoreStart
                    'sql92' => [
                        'string'     => 'SELECT "a".*, "b".* FROM "a" INNER JOIN (SELECT "c".* FROM "c" WHERE "cc" = \'10\') AS "b" ON "d"="e" WHERE "x" = \'20\'',
                        'prepare'    => 'SELECT "a".*, "b".* FROM "a" INNER JOIN (SELECT "c".* FROM "c" WHERE "cc" = ?) AS "b" ON "d"="e" WHERE "x" = ?',
                        'parameters' => ['subselect1where1' => 10, 'where1' => 20],
                    ],
                    'MySql' => [
                        'string'     => 'SELECT `a`.*, `b`.* FROM `a` INNER JOIN (SELECT `c`.* FROM `c` WHERE `cc` = \'10\') AS `b` ON `d`=`e` WHERE `x` = \'20\'',
                        'prepare'    => 'SELECT `a`.*, `b`.* FROM `a` INNER JOIN (SELECT `c`.* FROM `c` WHERE `cc` = ?) AS `b` ON `d`=`e` WHERE `x` = ?',
                        'parameters' => ['subselect2where1' => 10, 'where2' => 20],
                    ],
                    'Oracle' => [
                        'string'     => 'SELECT "a".*, "b".* FROM "a" INNER JOIN (SELECT "c".* FROM "c" WHERE "cc" = \'10\') "b" ON "d"="e" WHERE "x" = \'20\'',
                        'prepare'    => 'SELECT "a".*, "b".* FROM "a" INNER JOIN (SELECT "c".* FROM "c" WHERE "cc" = ?) "b" ON "d"="e" WHERE "x" = ?',
                        'parameters' => ['subselect2where1' => 10, 'where2' => 20],
                    ],
                    'SqlServer' => [
                        'string'     => 'SELECT [a].*, [b].* FROM [a] INNER JOIN (SELECT [c].* FROM [c] WHERE [cc] = \'10\') AS [b] ON [d]=[e] WHERE [x] = \'20\'',
                        'prepare'    => 'SELECT [a].*, [b].* FROM [a] INNER JOIN (SELECT [c].* FROM [c] WHERE [cc] = ?) AS [b] ON [d]=[e] WHERE [x] = ?',
                        'parameters' => ['subselect2where1' => 10, 'where2' => 20],
                    ],
                    // @codingStandardsIgnoreEnd
                ],
            ],
            'Ddl::CreateTable::processColumns()' => [
                'sqlObject' => $this->createTable('foo')
                                    ->addColumn($this->createColumn('col1')
                                        ->setOption('identity', true)
                                        ->setOption('comment', 'Comment1'))
                                    ->addColumn($this->createColumn('col2')
                                        ->setOption('identity', true)
                                        ->setOption('comment', 'Comment2')),
                'expected'  => [
                    // @codingStandardsIgnoreStart
                    'sql92'     => "CREATE TABLE \"foo\" ( \n    \"col1\" INTEGER NOT NULL,\n    \"col2\" INTEGER NOT NULL \n)",
                    'MySql'     => "CREATE TABLE `foo` ( \n    `col1` INTEGER NOT NULL AUTO_INCREMENT COMMENT 'Comment1',\n    `col2` INTEGER NOT NULL AUTO_INCREMENT COMMENT 'Comment2' \n)",
                    'Oracle'    => "CREATE TABLE \"foo\" ( \n    \"col1\" INTEGER NOT NULL,\n    \"col2\" INTEGER NOT NULL \n)",
                    'SqlServer' => "CREATE TABLE [foo] ( \n    [col1] INTEGER NOT NULL,\n    [col2] INTEGER NOT NULL \n)",
                    // @codingStandardsIgnoreEnd
                ],
            ],
            'Ddl::CreateTable::processTable()' => [
                'sqlObject' => $this->createTable('foo')->setTemporary(true),
                'expected'  => [
                    'sql92'     => "CREATE TEMPORARY TABLE \"foo\" ( \n)",
                    'MySql'     => "CREATE TEMPORARY TABLE `foo` ( \n)",
                    'Oracle'    => "CREATE TEMPORARY TABLE \"foo\" ( \n)",
                    'SqlServer' => "CREATE TABLE [#foo] ( \n)",
                ],
            ],
            'Select::processSubSelect()' => [
                'sqlObject' => $this->select([
                    'a' => $this->select([
                        'b' => $this->select('c')->where(['cc' => 'CC']),
                    ])->where(['bb' => 'BB']),
                ])->where(['aa' => 'AA']),
                'expected'  => [
                    // @codingStandardsIgnoreStart
                    'sql92' => [
                        'string'     => 'SELECT "a".* FROM (SELECT "b".* FROM (SELECT "c".* FROM "c" WHERE "cc" = \'CC\') AS "b" WHERE "bb" = \'BB\') AS "a" WHERE "aa" = \'AA\'',
                        'prepare'    => 'SELECT "a".* FROM (SELECT "b".* FROM (SELECT "c".* FROM "c" WHERE "cc" = ?) AS "b" WHERE "bb" = ?) AS "a" WHERE "aa" = ?',
                        'parameters' => ['subselect2where1' => 'CC', 'subselect1where1' => 'BB', 'where1' => 'AA'],
                    ],
                    'MySql' => [
                        'string'     => 'SELECT `a`.* FROM (SELECT `b`.* FROM (SELECT `c`.* FROM `c` WHERE `cc` = \'CC\') AS `b` WHERE `bb` = \'BB\') AS `a` WHERE `aa` = \'AA\'',
                        'prepare'    => 'SELECT `a`.* FROM (SELECT `b`.* FROM (SELECT `c`.* FROM `c` WHERE `cc` = ?) AS `b` WHERE `bb` = ?) AS `a` WHERE `aa` = ?',
                        'parameters' => ['subselect4where1' => 'CC', 'subselect3where1' => 'BB', 'where2' => 'AA'],
                    ],
                    'Oracle' => [
                        'string'     => 'SELECT "a".* FROM (SELECT "b".* FROM (SELECT "c".* FROM "c" WHERE "cc" = \'CC\') "b" WHERE "bb" = \'BB\') "a" WHERE "aa" = \'AA\'',
                        'prepare'    => 'SELECT "a".* FROM (SELECT "b".* FROM (SELECT "c".* FROM "c" WHERE "cc" = ?) "b" WHERE "bb" = ?) "a" WHERE "aa" = ?',
                        'parameters' => ['subselect4where1' => 'CC', 'subselect3where1' => 'BB', 'where2' => 'AA'],
                    ],
                    'SqlServer' => [
                        'string'     => 'SELECT [a].* FROM (SELECT [b].* FROM (SELECT [c].* FROM [c] WHERE [cc] = \'CC\') AS [b] WHERE [bb] = \'BB\') AS [a] WHERE [aa] = \'AA\'',
                        'prepare'    => 'SELECT [a].* FROM (SELECT [b].* FROM (SELECT [c].* FROM [c] WHERE [cc] = ?) AS [b] WHERE [bb] = ?) AS [a] WHERE [aa] = ?',
                        'parameters' => ['subselect4where1' => 'CC', 'subselect3where1' => 'BB', 'where2' => 'AA'],
                    ],
                    // @codingStandardsIgnoreEnd
                ],
            ],
            'Delete::processSubSelect()' => [
                'sqlObject' => $this->delete('foo')->where(['x' => $this->select('foo')->where(['x' => 'y'])]),
                'expected'  => [
                    'sql92'     => [
                        'string'     => 'DELETE FROM "foo" WHERE "x" = (SELECT "foo".* FROM "foo" WHERE "x" = \'y\')',
                        'prepare'    => 'DELETE FROM "foo" WHERE "x" = (SELECT "foo".* FROM "foo" WHERE "x" = ?)',
                        'parameters' => ['subselect1where1' => 'y'],
                    ],
                    'MySql'     => [
                        'string'     => 'DELETE FROM `foo` WHERE `x` = (SELECT `foo`.* FROM `foo` WHERE `x` = \'y\')',
                        'prepare'    => 'DELETE FROM `foo` WHERE `x` = (SELECT `foo`.* FROM `foo` WHERE `x` = ?)',
                        'parameters' => ['subselect2where1' => 'y'],
                    ],
                    'Oracle'    => [
                        'string'     => 'DELETE FROM "foo" WHERE "x" = (SELECT "foo".* FROM "foo" WHERE "x" = \'y\')',
                        'prepare'    => 'DELETE FROM "foo" WHERE "x" = (SELECT "foo".* FROM "foo" WHERE "x" = ?)',
                        'parameters' => ['subselect3where1' => 'y'],
                    ],
                    'SqlServer' => [
                        'string'     => 'DELETE FROM [foo] WHERE [x] = (SELECT [foo].* FROM [foo] WHERE [x] = \'y\')',
                        'prepare'    => 'DELETE FROM [foo] WHERE [x] = (SELECT [foo].* FROM [foo] WHERE [x] = ?)',
                        'parameters' => ['subselect4where1' => 'y'],
                    ],
                ],
            ],
            'Update::processSubSelect()' => [
                'sqlObject' => $this->update('foo')->set(['x' => $this->select('foo')]),
                'expected'  => [
                    'sql92'     => 'UPDATE "foo" SET "x" = (SELECT "foo".* FROM "foo")',
                    'MySql'     => 'UPDATE `foo` SET `x` = (SELECT `foo`.* FROM `foo`)',
                    'Oracle'    => 'UPDATE "foo" SET "x" = (SELECT "foo".* FROM "foo")',
                    'SqlServer' => 'UPDATE [foo] SET [x] = (SELECT [foo].* FROM [foo])',
                ],
            ],
            'Insert::processSubSelect()' => [
                'sqlObject' => $this->insert('foo')->select($this->select('foo')->where(['x' => 'y'])),
                'expected'  => [
                    'sql92'     => [
                        'string'     => 'INSERT INTO "foo"  SELECT "foo".* FROM "foo" WHERE "x" = \'y\'',
                        'prepare'    => 'INSERT INTO "foo"  SELECT "foo".* FROM "foo" WHERE "x" = ?',
                        'parameters' => ['subselect1where1' => 'y'],
                    ],
                    'MySql'     => [
                        'string'     => 'INSERT INTO `foo`  SELECT `foo`.* FROM `foo` WHERE `x` = \'y\'',
                        'prepare'    => 'INSERT INTO `foo`  SELECT `foo`.* FROM `foo` WHERE `x` = ?',
                        'parameters' => ['subselect2where1' => 'y'],
                    ],
                    'Oracle'    => [
                        'string'     => 'INSERT INTO "foo"  SELECT "foo".* FROM "foo" WHERE "x" = \'y\'',
                        'prepare'    => 'INSERT INTO "foo"  SELECT "foo".* FROM "foo" WHERE "x" = ?',
                        'parameters' => ['subselect3where1' => 'y'],
                    ],
                    'SqlServer' => [
                        'string'     => 'INSERT INTO [foo]  SELECT [foo].* FROM [foo] WHERE [x] = \'y\'',
                        'prepare'    => 'INSERT INTO [foo]  SELECT [foo].* FROM [foo] WHERE [x] = ?',
                        'parameters' => ['subselect4where1' => 'y'],
                    ],
                ],
            ],
            'Update::processExpression()' => [
                'sqlObject' => $this->update('foo')->set(
                    ['x' => new Sql\Expression('?', [$this->select('foo')->where(['x' => 'y'])])]
                ),
                'expected'  => [
                    'sql92'     => [
                        'string'     => 'UPDATE "foo" SET "x" = (SELECT "foo".* FROM "foo" WHERE "x" = \'y\')',
                        'prepare'    => 'UPDATE "foo" SET "x" = (SELECT "foo".* FROM "foo" WHERE "x" = ?)',
                        'parameters' => ['subselect1where1' => 'y'],
                    ],
                    'MySql'     => [
                        'string'     => 'UPDATE `foo` SET `x` = (SELECT `foo`.* FROM `foo` WHERE `x` = \'y\')',
                        'prepare'    => 'UPDATE `foo` SET `x` = (SELECT `foo`.* FROM `foo` WHERE `x` = ?)',
                        'parameters' => ['subselect2where1' => 'y'],
                    ],
                    'Oracle'    => [
                        'string'     => 'UPDATE "foo" SET "x" = (SELECT "foo".* FROM "foo" WHERE "x" = \'y\')',
                        'prepare'    => 'UPDATE "foo" SET "x" = (SELECT "foo".* FROM "foo" WHERE "x" = ?)',
                        'parameters' => ['subselect3where1' => 'y'],
                    ],
                    'SqlServer' => [
                        'string'     => 'UPDATE [foo] SET [x] = (SELECT [foo].* FROM [foo] WHERE [x] = \'y\')',
                        'prepare'    => 'UPDATE [foo] SET [x] = (SELECT [foo].* FROM [foo] WHERE [x] = ?)',
                        'parameters' => ['subselect4where1' => 'y'],
                    ],
                ],
            ],
            'Update::processJoins()' => [
                'sqlObject' => $this->update('foo')->set(['x' => 'y'])->where(['xx' => 'yy'])->join(
                    'bar',
                    'bar.barId = foo.barId'
                ),
                'expected'  => [
                    // @codingStandardsIgnoreStart
                    'sql92'     => [
                        'string' => 'UPDATE "foo" INNER JOIN "bar" ON "bar"."barId" = "foo"."barId" SET "x" = \'y\' WHERE "xx" = \'yy\'',
                    ],
                    'MySql'     => [
                        'string' => 'UPDATE `foo` INNER JOIN `bar` ON `bar`.`barId` = `foo`.`barId` SET `x` = \'y\' WHERE `xx` = \'yy\'',
                    ],
                    'Oracle'     => [
                        'string' => 'UPDATE "foo" INNER JOIN "bar" ON "bar"."barId" = "foo"."barId" SET "x" = \'y\' WHERE "xx" = \'yy\'',
                    ],
                    'SqlServer' => [
                        'string' => 'UPDATE [foo] INNER JOIN [bar] ON [bar].[barId] = [foo].[barId] SET [x] = \'y\' WHERE [xx] = \'yy\'',
                    ],
                    // @codingStandardsIgnoreEnd
                ],
            ],
        ];
    }

    protected function dataProviderDecorators()
    {
        return [
            'RootDecorators::Select' => [
                'sqlObject' => $this->select('foo')->where(['x' => $this->select('bar')]),
                'expected'  => [
                    'sql92'     => [
                        'decorators' => [
                            'Zend\Db\Sql\Select' => new TestAsset\SelectDecorator,
                        ],
                        'string' => 'SELECT "foo".* FROM "foo" WHERE "x" = (SELECT "bar".* FROM "bar")',
                    ],
                    'MySql'     => [
                        'decorators' => [
                            'Zend\Db\Sql\Select' => new TestAsset\SelectDecorator,
                        ],
                        'string' => 'SELECT `foo`.* FROM `foo` WHERE `x` = (SELECT `bar`.* FROM `bar`)',
                    ],
                    'Oracle'    => [
                        'decorators' => [
                            'Zend\Db\Sql\Select' => new TestAsset\SelectDecorator,
                        ],
                        'string' => 'SELECT "foo".* FROM "foo" WHERE "x" = (SELECT "bar".* FROM "bar")',
                    ],
                    'SqlServer' => [
                        'decorators' => [
                            'Zend\Db\Sql\Select' => new TestAsset\SelectDecorator,
                        ],
                        'string' => 'SELECT [foo].* FROM [foo] WHERE [x] = (SELECT [bar].* FROM [bar])',
                    ],
                ],
            ],
            // @codingStandardsIgnoreStart
            /* TODO - should be implemented
            'RootDecorators::Insert' => array(
                'sqlObject' => $this->insert('foo')->select($this->select()),
                'expected'  => array(
                    'sql92'     => array(
                        'decorators' => array(
                            'Zend\Db\Sql\Insert' => new TestAsset\InsertDecorator, // Decorator for root sqlObject
                            'Zend\Db\Sql\Select' => array('Zend\Db\Sql\Platform\Mysql\SelectDecorator', '{=SELECT_Sql92=}')
                        ),
                        'string' => 'INSERT INTO "foo"  {=SELECT_Sql92=}',
                    ),
                    'MySql'     => array(
                        'decorators' => array(
                            'Zend\Db\Sql\Insert' => new TestAsset\InsertDecorator, // Decorator for root sqlObject
                            'Zend\Db\Sql\Select' => array('Zend\Db\Sql\Platform\Mysql\SelectDecorator', '{=SELECT_MySql=}')
                        ),
                        'string' => 'INSERT INTO `foo`  {=SELECT_MySql=}',
                    ),
                    'Oracle'    => array(
                        'decorators' => array(
                            'Zend\Db\Sql\Insert' => new TestAsset\InsertDecorator, // Decorator for root sqlObject
                            'Zend\Db\Sql\Select' => array('Zend\Db\Sql\Platform\Oracle\SelectDecorator', '{=SELECT_Oracle=}')
                        ),
                        'string' => 'INSERT INTO "foo"  {=SELECT_Oracle=}',
                    ),
                    'SqlServer' => array(
                        'decorators' => array(
                            'Zend\Db\Sql\Insert' => new TestAsset\InsertDecorator, // Decorator for root sqlObject
                            'Zend\Db\Sql\Select' => array('Zend\Db\Sql\Platform\SqlServer\SelectDecorator', '{=SELECT_SqlServer=}')
                        ),
                        'string' => 'INSERT INTO [foo]  {=SELECT_SqlServer=}',
                    ),
                ),
            ),
            'RootDecorators::Delete' => array(
                'sqlObject' => $this->delete('foo')->where(array('x'=>$this->select('foo'))),
                'expected'  => array(
                    'sql92'     => array(
                        'decorators' => array(
                            'Zend\Db\Sql\Delete' => new TestAsset\DeleteDecorator,
                            'Zend\Db\Sql\Select' => array('Zend\Db\Sql\Platform\Mysql\SelectDecorator', '{=SELECT_Sql92=}')
                        ),
                        'string' => 'DELETE FROM "foo" WHERE "x" = ({=SELECT_Sql92=})',
                    ),
                    'MySql'     => array(
                        'decorators' => array(
                            'Zend\Db\Sql\Delete' => new TestAsset\DeleteDecorator,
                            'Zend\Db\Sql\Select' => array('Zend\Db\Sql\Platform\Mysql\SelectDecorator', '{=SELECT_MySql=}')
                        ),
                        'string' => 'DELETE FROM `foo` WHERE `x` = ({=SELECT_MySql=})',
                    ),
                    'Oracle'    => array(
                        'decorators' => array(
                            'Zend\Db\Sql\Delete' => new TestAsset\DeleteDecorator,
                            'Zend\Db\Sql\Select' => array('Zend\Db\Sql\Platform\Oracle\SelectDecorator', '{=SELECT_Oracle=}')
                        ),
                        'string' => 'DELETE FROM "foo" WHERE "x" = ({=SELECT_Oracle=})',
                    ),
                    'SqlServer' => array(
                        'decorators' => array(
                            'Zend\Db\Sql\Delete' => new TestAsset\DeleteDecorator,
                            'Zend\Db\Sql\Select' => array('Zend\Db\Sql\Platform\SqlServer\SelectDecorator', '{=SELECT_SqlServer=}')
                        ),
                        'string' => 'DELETE FROM [foo] WHERE [x] = ({=SELECT_SqlServer=})',
                    ),
                ),
            ),
            'RootDecorators::Update' => array(
                'sqlObject' => $this->update('foo')->where(array('x'=>$this->select('foo'))),
                'expected'  => array(
                    'sql92'     => array(
                        'decorators' => array(
                            'Zend\Db\Sql\Update' => new TestAsset\UpdateDecorator,
                            'Zend\Db\Sql\Select' => array('Zend\Db\Sql\Platform\Mysql\SelectDecorator', '{=SELECT_Sql92=}')
                        ),
                        'string' => 'UPDATE "foo" SET  WHERE "x" = ({=SELECT_Sql92=})',
                    ),
                    'MySql'     => array(
                        'decorators' => array(
                            'Zend\Db\Sql\Update' => new TestAsset\UpdateDecorator,
                            'Zend\Db\Sql\Select' => array('Zend\Db\Sql\Platform\Mysql\SelectDecorator', '{=SELECT_MySql=}')
                        ),
                        'string' => 'UPDATE `foo` SET  WHERE `x` = ({=SELECT_MySql=})',
                    ),
                    'Oracle'    => array(
                        'decorators' => array(
                            'Zend\Db\Sql\Update' => new TestAsset\UpdateDecorator,
                            'Zend\Db\Sql\Select' => array('Zend\Db\Sql\Platform\Oracle\SelectDecorator', '{=SELECT_Oracle=}')
                        ),
                        'string' => 'UPDATE "foo" SET  WHERE "x" = ({=SELECT_Oracle=})',
                    ),
                    'SqlServer' => array(
                        'decorators' => array(
                            'Zend\Db\Sql\Update' => new TestAsset\UpdateDecorator,
                            'Zend\Db\Sql\Select' => array('Zend\Db\Sql\Platform\SqlServer\SelectDecorator', '{=SELECT_SqlServer=}')
                        ),
                        'string' => 'UPDATE [foo] SET  WHERE [x] = ({=SELECT_SqlServer=})',
                    ),
                ),
            ),
            'DecorableExpression()' => array(
                'sqlObject' => $this->update('foo')->where(array('x'=>new Sql\Expression('?', array($this->select('foo'))))),
                'expected'  => array(
                    'sql92'     => array(
                        'decorators' => array(
                            'Zend\Db\Sql\Expression' => new TestAsset\DecorableExpression,
                            'Zend\Db\Sql\Select'     => array('Zend\Db\Sql\Platform\Mysql\SelectDecorator', '{=SELECT_Sql92=}')
                        ),
                        'string'     => 'UPDATE "foo" SET  WHERE "x" = {decorate-({=SELECT_Sql92=})-decorate}',
                    ),
                    'MySql'     => array(
                        'decorators' => array(
                            'Zend\Db\Sql\Expression' => new TestAsset\DecorableExpression,
                            'Zend\Db\Sql\Select'     => array('Zend\Db\Sql\Platform\Mysql\SelectDecorator', '{=SELECT_MySql=}')
                        ),
                        'string'     => 'UPDATE `foo` SET  WHERE `x` = {decorate-({=SELECT_MySql=})-decorate}',
                    ),
                    'Oracle'    => array(
                        'decorators' => array(
                            'Zend\Db\Sql\Expression' => new TestAsset\DecorableExpression,
                            'Zend\Db\Sql\Select'     => array('Zend\Db\Sql\Platform\Oracle\SelectDecorator', '{=SELECT_Oracle=}')
                        ),
                        'string'     => 'UPDATE "foo" SET  WHERE "x" = {decorate-({=SELECT_Oracle=})-decorate}',
                    ),
                    'SqlServer' => array(
                        'decorators' => array(
                            'Zend\Db\Sql\Expression' => new TestAsset\DecorableExpression,
                            'Zend\Db\Sql\Select'     => array('Zend\Db\Sql\Platform\SqlServer\SelectDecorator', '{=SELECT_SqlServer=}')
                        ),
                        'string'     => 'UPDATE [foo] SET  WHERE [x] = {decorate-({=SELECT_SqlServer=})-decorate}',
                    ),
                ),
            ),*/
            // @codingStandardsIgnoreEnd
        ];
    }

    public function dataProvider()
    {
        $data = array_merge(
            $this->dataProviderCommonProcessMethods(),
            $this->dataProviderDecorators()
        );

        $res = [];
        foreach ($data as $index => $test) {
            foreach ($test['expected'] as $platform => $expected) {
                $res[$index . '->' . $platform] = [
                    'sqlObject' => $test['sqlObject'],
                    'platform'  => $platform,
                    'expected'  => $expected,
                ];
            }
        }
        return $res;
    }

    /**
     * @param type $sqlObject
     * @param type $platform
     * @param type $expected
     * @dataProvider dataProvider
     */
    public function test($sqlObject, $platform, $expected)
    {
        $sql = new Sql\Sql($this->resolveAdapter($platform));

        if (is_array($expected) && isset($expected['decorators'])) {
            foreach ($expected['decorators'] as $type => $decorator) {
                $sql->getSqlPlatform()->setTypeDecorator($type, $this->resolveDecorator($decorator));
            }
        }

        $expectedString = is_string($expected) ? $expected : (isset($expected['string']) ? $expected['string'] : null);
        if ($expectedString) {
            $actual = $sql->getSqlStringForSqlObject($sqlObject);
            self::assertEquals($expectedString, $actual, "getSqlString()");
        }
        if (is_array($expected) && isset($expected['prepare'])) {
            $actual = $sql->prepareStatementForSqlObject($sqlObject);
            self::assertEquals($expected['prepare'], $actual->getSql(), "prepareStatement()");
            if (isset($expected['parameters'])) {
                $actual = $actual->getParameterContainer()->getNamedArray();
                self::assertSame($expected['parameters'], $actual, "parameterContainer()");
            }
        }
    }

    protected function resolveDecorator($decorator)
    {
        if (is_array($decorator)) {
            $decoratorMock = $this->getMockBuilder($decorator[0])
                ->setMethods(['buildSqlString'])
                ->setConstructorArgs([null])
                ->getMock();
            $decoratorMock->expects($this->any())->method('buildSqlString')->will($this->returnValue($decorator[1]));
            return $decoratorMock;
        }
        if ($decorator instanceof Sql\Platform\PlatformDecoratorInterface) {
            return $decorator;
        }
        return;
    }

    protected function resolveAdapter($platform)
    {
        switch ($platform) {
            case 'sql92':
                $platform  = new TestAsset\TrustingSql92Platform();
                break;
            case 'MySql':
                $platform  = new TestAsset\TrustingMysqlPlatform();
                break;
            case 'Oracle':
                $platform  = new TestAsset\TrustingOraclePlatform();
                break;
            case 'SqlServer':
                $platform  = new TestAsset\TrustingSqlServerPlatform();
                break;
            default:
                $platform = null;
        }

        $mockDriver = $this->getMockBuilder('Zend\Db\Adapter\Driver\DriverInterface')->getMock();
        $mockDriver->expects($this->any())->method('formatParameterName')->will($this->returnValue('?'));
        $mockDriver->expects($this->any())->method('createStatement')->will($this->returnCallback(function () {
            return new Adapter\StatementContainer;
        }));

        return new Adapter\Adapter($mockDriver, $platform);
    }

    public function __call($name, $arguments)
    {
        $arg0 = isset($arguments[0]) ? $arguments[0] : null;
        switch ($name) {
            case 'select':
                return new Sql\Select($arg0);
            case 'delete':
                return new Sql\Delete($arg0);
            case 'update':
                return new Sql\Update($arg0);
            case 'insert':
                return new Sql\Insert($arg0);
            case 'createTable':
                return new Sql\Ddl\CreateTable($arg0);
            case 'createColumn':
                return new Sql\Ddl\Column\Column($arg0);
        }
    }
}
