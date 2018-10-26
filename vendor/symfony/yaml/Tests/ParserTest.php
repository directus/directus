<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Yaml\Tests;

use PHPUnit\Framework\TestCase;
use Symfony\Component\Yaml\Exception\ParseException;
use Symfony\Component\Yaml\Parser;
use Symfony\Component\Yaml\Tag\TaggedValue;
use Symfony\Component\Yaml\Yaml;

class ParserTest extends TestCase
{
    /** @var Parser */
    protected $parser;

    protected function setUp()
    {
        $this->parser = new Parser();
    }

    protected function tearDown()
    {
        $this->parser = null;

        chmod(__DIR__.'/Fixtures/not_readable.yml', 0644);
    }

    /**
     * @dataProvider getDataFormSpecifications
     */
    public function testSpecifications($expected, $yaml, $comment)
    {
        $this->assertEquals($expected, var_export($this->parser->parse($yaml), true), $comment);
    }

    public function getDataFormSpecifications()
    {
        return $this->loadTestsFromFixtureFiles('index.yml');
    }

    public function getNonStringMappingKeysData()
    {
        return $this->loadTestsFromFixtureFiles('nonStringKeys.yml');
    }

    public function testTabsInYaml()
    {
        // test tabs in YAML
        $yamls = array(
            "foo:\n	bar",
            "foo:\n 	bar",
            "foo:\n	 bar",
            "foo:\n 	 bar",
        );

        foreach ($yamls as $yaml) {
            try {
                $content = $this->parser->parse($yaml);

                $this->fail('YAML files must not contain tabs');
            } catch (\Exception $e) {
                $this->assertInstanceOf('\Exception', $e, 'YAML files must not contain tabs');
                $this->assertEquals('A YAML file cannot contain tabs as indentation at line 2 (near "'.strpbrk($yaml, "\t").'").', $e->getMessage(), 'YAML files must not contain tabs');
            }
        }
    }

    public function testEndOfTheDocumentMarker()
    {
        $yaml = <<<'EOF'
--- %YAML:1.0
foo
...
EOF;

        $this->assertEquals('foo', $this->parser->parse($yaml));
    }

    public function getBlockChompingTests()
    {
        $tests = array();

        $yaml = <<<'EOF'
foo: |-
    one
    two
bar: |-
    one
    two

EOF;
        $expected = array(
            'foo' => "one\ntwo",
            'bar' => "one\ntwo",
        );
        $tests['Literal block chomping strip with single trailing newline'] = array($expected, $yaml);

        $yaml = <<<'EOF'
foo: |-
    one
    two

bar: |-
    one
    two


EOF;
        $expected = array(
            'foo' => "one\ntwo",
            'bar' => "one\ntwo",
        );
        $tests['Literal block chomping strip with multiple trailing newlines'] = array($expected, $yaml);

        $yaml = <<<'EOF'
{}


EOF;
        $expected = array();
        $tests['Literal block chomping strip with multiple trailing newlines after a 1-liner'] = array($expected, $yaml);

        $yaml = <<<'EOF'
foo: |-
    one
    two
bar: |-
    one
    two
EOF;
        $expected = array(
            'foo' => "one\ntwo",
            'bar' => "one\ntwo",
        );
        $tests['Literal block chomping strip without trailing newline'] = array($expected, $yaml);

        $yaml = <<<'EOF'
foo: |
    one
    two
bar: |
    one
    two

EOF;
        $expected = array(
            'foo' => "one\ntwo\n",
            'bar' => "one\ntwo\n",
        );
        $tests['Literal block chomping clip with single trailing newline'] = array($expected, $yaml);

        $yaml = <<<'EOF'
foo: |
    one
    two

bar: |
    one
    two


EOF;
        $expected = array(
            'foo' => "one\ntwo\n",
            'bar' => "one\ntwo\n",
        );
        $tests['Literal block chomping clip with multiple trailing newlines'] = array($expected, $yaml);

        $yaml = <<<'EOF'
foo:
- bar: |
    one

    two
EOF;
        $expected = array(
            'foo' => array(
                array(
                    'bar' => "one\n\ntwo",
                ),
            ),
        );
        $tests['Literal block chomping clip with embedded blank line inside unindented collection'] = array($expected, $yaml);

        $yaml = <<<'EOF'
foo: |
    one
    two
bar: |
    one
    two
EOF;
        $expected = array(
            'foo' => "one\ntwo\n",
            'bar' => "one\ntwo",
        );
        $tests['Literal block chomping clip without trailing newline'] = array($expected, $yaml);

        $yaml = <<<'EOF'
foo: |+
    one
    two
bar: |+
    one
    two

EOF;
        $expected = array(
            'foo' => "one\ntwo\n",
            'bar' => "one\ntwo\n",
        );
        $tests['Literal block chomping keep with single trailing newline'] = array($expected, $yaml);

        $yaml = <<<'EOF'
foo: |+
    one
    two

bar: |+
    one
    two


EOF;
        $expected = array(
            'foo' => "one\ntwo\n\n",
            'bar' => "one\ntwo\n\n",
        );
        $tests['Literal block chomping keep with multiple trailing newlines'] = array($expected, $yaml);

        $yaml = <<<'EOF'
foo: |+
    one
    two
bar: |+
    one
    two
EOF;
        $expected = array(
            'foo' => "one\ntwo\n",
            'bar' => "one\ntwo",
        );
        $tests['Literal block chomping keep without trailing newline'] = array($expected, $yaml);

        $yaml = <<<'EOF'
foo: >-
    one
    two
bar: >-
    one
    two

EOF;
        $expected = array(
            'foo' => 'one two',
            'bar' => 'one two',
        );
        $tests['Folded block chomping strip with single trailing newline'] = array($expected, $yaml);

        $yaml = <<<'EOF'
foo: >-
    one
    two

bar: >-
    one
    two


EOF;
        $expected = array(
            'foo' => 'one two',
            'bar' => 'one two',
        );
        $tests['Folded block chomping strip with multiple trailing newlines'] = array($expected, $yaml);

        $yaml = <<<'EOF'
foo: >-
    one
    two
bar: >-
    one
    two
EOF;
        $expected = array(
            'foo' => 'one two',
            'bar' => 'one two',
        );
        $tests['Folded block chomping strip without trailing newline'] = array($expected, $yaml);

        $yaml = <<<'EOF'
foo: >
    one
    two
bar: >
    one
    two

EOF;
        $expected = array(
            'foo' => "one two\n",
            'bar' => "one two\n",
        );
        $tests['Folded block chomping clip with single trailing newline'] = array($expected, $yaml);

        $yaml = <<<'EOF'
foo: >
    one
    two

bar: >
    one
    two


EOF;
        $expected = array(
            'foo' => "one two\n",
            'bar' => "one two\n",
        );
        $tests['Folded block chomping clip with multiple trailing newlines'] = array($expected, $yaml);

        $yaml = <<<'EOF'
foo: >
    one
    two
bar: >
    one
    two
EOF;
        $expected = array(
            'foo' => "one two\n",
            'bar' => 'one two',
        );
        $tests['Folded block chomping clip without trailing newline'] = array($expected, $yaml);

        $yaml = <<<'EOF'
foo: >+
    one
    two
bar: >+
    one
    two

EOF;
        $expected = array(
            'foo' => "one two\n",
            'bar' => "one two\n",
        );
        $tests['Folded block chomping keep with single trailing newline'] = array($expected, $yaml);

        $yaml = <<<'EOF'
foo: >+
    one
    two

bar: >+
    one
    two


EOF;
        $expected = array(
            'foo' => "one two\n\n",
            'bar' => "one two\n\n",
        );
        $tests['Folded block chomping keep with multiple trailing newlines'] = array($expected, $yaml);

        $yaml = <<<'EOF'
foo: >+
    one
    two
bar: >+
    one
    two
EOF;
        $expected = array(
            'foo' => "one two\n",
            'bar' => 'one two',
        );
        $tests['Folded block chomping keep without trailing newline'] = array($expected, $yaml);

        return $tests;
    }

    /**
     * @dataProvider getBlockChompingTests
     */
    public function testBlockChomping($expected, $yaml)
    {
        $this->assertSame($expected, $this->parser->parse($yaml));
    }

    /**
     * Regression test for issue #7989.
     *
     * @see https://github.com/symfony/symfony/issues/7989
     */
    public function testBlockLiteralWithLeadingNewlines()
    {
        $yaml = <<<'EOF'
foo: |-


    bar

EOF;
        $expected = array(
            'foo' => "\n\nbar",
        );

        $this->assertSame($expected, $this->parser->parse($yaml));
    }

    public function testObjectSupportEnabled()
    {
        $input = <<<'EOF'
foo: !php/object O:30:"Symfony\Component\Yaml\Tests\B":1:{s:1:"b";s:3:"foo";}
bar: 1
EOF;
        $this->assertEquals(array('foo' => new B(), 'bar' => 1), $this->parser->parse($input, Yaml::PARSE_OBJECT), '->parse() is able to parse objects');
    }

    public function testObjectSupportDisabledButNoExceptions()
    {
        $input = <<<'EOF'
foo: !php/object O:30:"Symfony\Tests\Component\Yaml\B":1:{s:1:"b";s:3:"foo";}
bar: 1
EOF;
        $this->assertEquals(array('foo' => null, 'bar' => 1), $this->parser->parse($input), '->parse() does not parse objects');
    }

    /**
     * @dataProvider getObjectForMapTests
     */
    public function testObjectForMap($yaml, $expected)
    {
        $flags = Yaml::PARSE_OBJECT_FOR_MAP;

        $this->assertEquals($expected, $this->parser->parse($yaml, $flags));
    }

    public function getObjectForMapTests()
    {
        $tests = array();

        $yaml = <<<'EOF'
foo:
    fiz: [cat]
EOF;
        $expected = new \stdClass();
        $expected->foo = new \stdClass();
        $expected->foo->fiz = array('cat');
        $tests['mapping'] = array($yaml, $expected);

        $yaml = '{ "foo": "bar", "fiz": "cat" }';
        $expected = new \stdClass();
        $expected->foo = 'bar';
        $expected->fiz = 'cat';
        $tests['inline-mapping'] = array($yaml, $expected);

        $yaml = "foo: bar\nbaz: foobar";
        $expected = new \stdClass();
        $expected->foo = 'bar';
        $expected->baz = 'foobar';
        $tests['object-for-map-is-applied-after-parsing'] = array($yaml, $expected);

        $yaml = <<<'EOT'
array:
  - key: one
  - key: two
EOT;
        $expected = new \stdClass();
        $expected->array = array();
        $expected->array[0] = new \stdClass();
        $expected->array[0]->key = 'one';
        $expected->array[1] = new \stdClass();
        $expected->array[1]->key = 'two';
        $tests['nest-map-and-sequence'] = array($yaml, $expected);

        $yaml = <<<'YAML'
map:
  1: one
  2: two
YAML;
        $expected = new \stdClass();
        $expected->map = new \stdClass();
        $expected->map->{1} = 'one';
        $expected->map->{2} = 'two';
        $tests['numeric-keys'] = array($yaml, $expected);

        $yaml = <<<'YAML'
map:
  '0': one
  '1': two
YAML;
        $expected = new \stdClass();
        $expected->map = new \stdClass();
        $expected->map->{0} = 'one';
        $expected->map->{1} = 'two';
        $tests['zero-indexed-numeric-keys'] = array($yaml, $expected);

        return $tests;
    }

    /**
     * @expectedException \Symfony\Component\Yaml\Exception\ParseException
     */
    public function testObjectsSupportDisabledWithExceptions()
    {
        $yaml = <<<'EOF'
foo: !php/object:O:30:"Symfony\Tests\Component\Yaml\B":1:{s:1:"b";s:3:"foo";}
bar: 1
EOF;

        $this->parser->parse($yaml, Yaml::PARSE_EXCEPTION_ON_INVALID_TYPE);
    }

    public function testCanParseContentWithTrailingSpaces()
    {
        $yaml = "items:  \n  foo: bar";

        $expected = array(
            'items' => array('foo' => 'bar'),
        );

        $this->assertSame($expected, $this->parser->parse($yaml));
    }

    /**
     * @requires extension iconv
     */
    public function testNonUtf8Exception()
    {
        $yamls = array(
            iconv('UTF-8', 'ISO-8859-1', "foo: 'äöüß'"),
            iconv('UTF-8', 'ISO-8859-15', "euro: '€'"),
            iconv('UTF-8', 'CP1252', "cp1252: '©ÉÇáñ'"),
        );

        foreach ($yamls as $yaml) {
            try {
                $this->parser->parse($yaml);

                $this->fail('charsets other than UTF-8 are rejected.');
            } catch (\Exception $e) {
                $this->assertInstanceOf('Symfony\Component\Yaml\Exception\ParseException', $e, 'charsets other than UTF-8 are rejected.');
            }
        }
    }

    /**
     * @expectedException \Symfony\Component\Yaml\Exception\ParseException
     */
    public function testUnindentedCollectionException()
    {
        $yaml = <<<'EOF'

collection:
-item1
-item2
-item3

EOF;

        $this->parser->parse($yaml);
    }

    /**
     * @expectedException \Symfony\Component\Yaml\Exception\ParseException
     */
    public function testShortcutKeyUnindentedCollectionException()
    {
        $yaml = <<<'EOF'

collection:
-  key: foo
  foo: bar

EOF;

        $this->parser->parse($yaml);
    }

    /**
     * @expectedException \Symfony\Component\Yaml\Exception\ParseException
     * @expectedExceptionMessageRegExp /^Multiple documents are not supported.+/
     */
    public function testMultipleDocumentsNotSupportedException()
    {
        Yaml::parse(<<<'EOL'
# Ranking of 1998 home runs
---
- Mark McGwire
- Sammy Sosa
- Ken Griffey

# Team ranking
---
- Chicago Cubs
- St Louis Cardinals
EOL
        );
    }

    /**
     * @expectedException \Symfony\Component\Yaml\Exception\ParseException
     */
    public function testSequenceInAMapping()
    {
        Yaml::parse(<<<'EOF'
yaml:
  hash: me
  - array stuff
EOF
        );
    }

    public function testSequenceInMappingStartedBySingleDashLine()
    {
        $yaml = <<<'EOT'
a:
-
  b:
  -
    bar: baz
- foo
d: e
EOT;
        $expected = array(
            'a' => array(
                array(
                    'b' => array(
                        array(
                            'bar' => 'baz',
                        ),
                    ),
                ),
                'foo',
            ),
            'd' => 'e',
        );

        $this->assertSame($expected, $this->parser->parse($yaml));
    }

    public function testSequenceFollowedByCommentEmbeddedInMapping()
    {
        $yaml = <<<'EOT'
a:
    b:
        - c
# comment
    d: e
EOT;
        $expected = array(
            'a' => array(
                'b' => array('c'),
                'd' => 'e',
            ),
        );

        $this->assertSame($expected, $this->parser->parse($yaml));
    }

    public function testNonStringFollowedByCommentEmbeddedInMapping()
    {
        $yaml = <<<'EOT'
a:
    b:
        {}
# comment
    d:
        1.1
# another comment
EOT;
        $expected = array(
            'a' => array(
                'b' => array(),
                'd' => 1.1,
            ),
        );

        $this->assertSame($expected, $this->parser->parse($yaml));
    }

    public function getParseExceptionNotAffectedMultiLineStringLastResortParsing()
    {
        $tests = array();

        $yaml = <<<'EOT'
a
    b:
EOT;
        $tests['parse error on first line'] = array($yaml);

        $yaml = <<<'EOT'
a

b
    c:
EOT;
        $tests['parse error due to inconsistent indentation'] = array($yaml);

        $yaml = <<<'EOT'
 &  *  !  |  >  '  "  %  @  ` #, { asd a;sdasd }-@^qw3
EOT;
        $tests['symfony/symfony/issues/22967#issuecomment-322067742'] = array($yaml);

        return $tests;
    }

    /**
     * @dataProvider getParseExceptionNotAffectedMultiLineStringLastResortParsing
     * @expectedException \Symfony\Component\Yaml\Exception\ParseException
     */
    public function testParseExceptionNotAffectedByMultiLineStringLastResortParsing($yaml)
    {
        $this->parser->parse($yaml);
    }

    public function testMultiLineStringLastResortParsing()
    {
        $yaml = <<<'EOT'
test:
  You can have things that don't look like strings here
  true
  yes you can
EOT;
        $expected = array(
            'test' => 'You can have things that don\'t look like strings here true yes you can',
        );

        $this->assertSame($expected, $this->parser->parse($yaml));

        $yaml = <<<'EOT'
a:
    b
       c
EOT;
        $expected = array(
            'a' => 'b c',
        );

        $this->assertSame($expected, $this->parser->parse($yaml));
    }

    /**
     * @expectedException \Symfony\Component\Yaml\Exception\ParseException
     */
    public function testMappingInASequence()
    {
        Yaml::parse(<<<'EOF'
yaml:
  - array stuff
  hash: me
EOF
        );
    }

    /**
     * @expectedException \Symfony\Component\Yaml\Exception\ParseException
     * @expectedExceptionMessage missing colon
     */
    public function testScalarInSequence()
    {
        Yaml::parse(<<<'EOF'
foo:
    - bar
"missing colon"
    foo: bar
EOF
        );
    }

    /**
     * @expectedException \Symfony\Component\Yaml\Exception\ParseException
     * @expectedExceptionMessage Duplicate key "child" detected
     *
     * > It is an error for two equal keys to appear in the same mapping node.
     * > In such a case the YAML processor may continue, ignoring the second
     * > `key: value` pair and issuing an appropriate warning. This strategy
     * > preserves a consistent information model for one-pass and random access
     * > applications.
     *
     * @see http://yaml.org/spec/1.2/spec.html#id2759572
     * @see http://yaml.org/spec/1.1/#id932806
     */
    public function testMappingDuplicateKeyBlock()
    {
        $input = <<<'EOD'
parent:
    child: first
    child: duplicate
parent:
    child: duplicate
    child: duplicate
EOD;
        $expected = array(
            'parent' => array(
                'child' => 'first',
            ),
        );
        $this->assertSame($expected, Yaml::parse($input));
    }

    /**
     * @expectedException \Symfony\Component\Yaml\Exception\ParseException
     * @expectedExceptionMessage Duplicate key "child" detected
     */
    public function testMappingDuplicateKeyFlow()
    {
        $input = <<<'EOD'
parent: { child: first, child: duplicate }
parent: { child: duplicate, child: duplicate }
EOD;
        $expected = array(
            'parent' => array(
                'child' => 'first',
            ),
        );
        $this->assertSame($expected, Yaml::parse($input));
    }

    /**
     * @expectedException \Symfony\Component\Yaml\Exception\ParseException
     * @dataProvider getParseExceptionOnDuplicateData
     */
    public function testParseExceptionOnDuplicate($input, $duplicateKey, $lineNumber)
    {
        $this->expectExceptionMessage(sprintf('Duplicate key "%s" detected at line %d', $duplicateKey, $lineNumber));

        Yaml::parse($input);
    }

    public function getParseExceptionOnDuplicateData()
    {
        $tests = array();

        $yaml = <<<EOD
parent: { child: first, child: duplicate }
EOD;
        $tests[] = array($yaml, 'child', 1);

        $yaml = <<<EOD
parent:
  child: first,
  child: duplicate
EOD;
        $tests[] = array($yaml, 'child', 3);

        $yaml = <<<EOD
parent: { child: foo }
parent: { child: bar }
EOD;
        $tests[] = array($yaml, 'parent', 2);

        $yaml = <<<EOD
parent: { child_mapping: { value: bar},  child_mapping: { value: bar} }
EOD;
        $tests[] = array($yaml, 'child_mapping', 1);

        $yaml = <<<EOD
parent:
  child_mapping:
    value: bar
  child_mapping:
    value: bar
EOD;
        $tests[] = array($yaml, 'child_mapping', 4);

        $yaml = <<<EOD
parent: { child_sequence: ['key1', 'key2', 'key3'],  child_sequence: ['key1', 'key2', 'key3'] }
EOD;
        $tests[] = array($yaml, 'child_sequence', 1);

        $yaml = <<<EOD
parent:
  child_sequence:
    - key1
    - key2
    - key3
  child_sequence:
    - key1
    - key2
    - key3
EOD;
        $tests[] = array($yaml, 'child_sequence', 6);

        return $tests;
    }

    public function testEmptyValue()
    {
        $input = <<<'EOF'
hash:
EOF;

        $this->assertEquals(array('hash' => null), Yaml::parse($input));
    }

    public function testCommentAtTheRootIndent()
    {
        $this->assertEquals(array(
            'services' => array(
                'app.foo_service' => array(
                    'class' => 'Foo',
                ),
                'app/bar_service' => array(
                    'class' => 'Bar',
                ),
            ),
        ), Yaml::parse(<<<'EOF'
# comment 1
services:
# comment 2
    # comment 3
    app.foo_service:
        class: Foo
# comment 4
    # comment 5
    app/bar_service:
        class: Bar
EOF
        ));
    }

    public function testStringBlockWithComments()
    {
        $this->assertEquals(array('content' => <<<'EOT'
# comment 1
header

    # comment 2
    <body>
        <h1>title</h1>
    </body>

footer # comment3
EOT
        ), Yaml::parse(<<<'EOF'
content: |
    # comment 1
    header

        # comment 2
        <body>
            <h1>title</h1>
        </body>

    footer # comment3
EOF
        ));
    }

    public function testFoldedStringBlockWithComments()
    {
        $this->assertEquals(array(array('content' => <<<'EOT'
# comment 1
header

    # comment 2
    <body>
        <h1>title</h1>
    </body>

footer # comment3
EOT
        )), Yaml::parse(<<<'EOF'
-
    content: |
        # comment 1
        header

            # comment 2
            <body>
                <h1>title</h1>
            </body>

        footer # comment3
EOF
        ));
    }

    public function testNestedFoldedStringBlockWithComments()
    {
        $this->assertEquals(array(array(
            'title' => 'some title',
            'content' => <<<'EOT'
# comment 1
header

    # comment 2
    <body>
        <h1>title</h1>
    </body>

footer # comment3
EOT
        )), Yaml::parse(<<<'EOF'
-
    title: some title
    content: |
        # comment 1
        header

            # comment 2
            <body>
                <h1>title</h1>
            </body>

        footer # comment3
EOF
        ));
    }

    public function testReferenceResolvingInInlineStrings()
    {
        $this->assertEquals(array(
            'var' => 'var-value',
            'scalar' => 'var-value',
            'list' => array('var-value'),
            'list_in_list' => array(array('var-value')),
            'map_in_list' => array(array('key' => 'var-value')),
            'embedded_mapping' => array(array('key' => 'var-value')),
            'map' => array('key' => 'var-value'),
            'list_in_map' => array('key' => array('var-value')),
            'map_in_map' => array('foo' => array('bar' => 'var-value')),
        ), Yaml::parse(<<<'EOF'
var:  &var var-value
scalar: *var
list: [ *var ]
list_in_list: [[ *var ]]
map_in_list: [ { key: *var } ]
embedded_mapping: [ key: *var ]
map: { key: *var }
list_in_map: { key: [*var] }
map_in_map: { foo: { bar: *var } }
EOF
        ));
    }

    public function testYamlDirective()
    {
        $yaml = <<<'EOF'
%YAML 1.2
---
foo: 1
bar: 2
EOF;
        $this->assertEquals(array('foo' => 1, 'bar' => 2), $this->parser->parse($yaml));
    }

    /**
     * @expectedException \Symfony\Component\Yaml\Exception\ParseException
     * @expectedExceptionMessage Numeric keys are not supported. Quote your evaluable mapping keys instead
     */
    public function testFloatKeys()
    {
        $yaml = <<<'EOF'
foo:
    1.2: "bar"
    1.3: "baz"
EOF;

        $this->parser->parse($yaml);
    }

    /**
     * @expectedException \Symfony\Component\Yaml\Exception\ParseException
     * @expectedExceptionMessage Non-string keys are not supported. Quote your evaluable mapping keys instead
     */
    public function testBooleanKeys()
    {
        $yaml = <<<'EOF'
true: foo
false: bar
EOF;

        $this->parser->parse($yaml);
    }

    public function testExplicitStringCasting()
    {
        $yaml = <<<'EOF'
'1.2': "bar"
!!str 1.3: "baz"

'true': foo
!!str false: bar

!!str null: 'null'
'~': 'null'
EOF;

        $expected = array(
            '1.2' => 'bar',
            '1.3' => 'baz',
            'true' => 'foo',
            'false' => 'bar',
            'null' => 'null',
            '~' => 'null',
        );

        $this->assertEquals($expected, $this->parser->parse($yaml));
    }

    /**
     * @expectedException \Symfony\Component\Yaml\Exception\ParseException
     * @expectedExceptionMessage A colon cannot be used in an unquoted mapping value
     */
    public function testColonInMappingValueException()
    {
        $yaml = <<<'EOF'
foo: bar: baz
EOF;

        $this->parser->parse($yaml);
    }

    public function testColonInMappingValueExceptionNotTriggeredByColonInComment()
    {
        $yaml = <<<'EOT'
foo:
    bar: foobar # Note: a comment after a colon
EOT;

        $this->assertSame(array('foo' => array('bar' => 'foobar')), $this->parser->parse($yaml));
    }

    /**
     * @dataProvider getCommentLikeStringInScalarBlockData
     */
    public function testCommentLikeStringsAreNotStrippedInBlockScalars($yaml, $expectedParserResult)
    {
        $this->assertSame($expectedParserResult, $this->parser->parse($yaml));
    }

    public function getCommentLikeStringInScalarBlockData()
    {
        $tests = array();

        $yaml = <<<'EOT'
pages:
    -
        title: some title
        content: |
            # comment 1
            header

                # comment 2
                <body>
                    <h1>title</h1>
                </body>

            footer # comment3
EOT;
        $expected = array(
            'pages' => array(
                array(
                    'title' => 'some title',
                    'content' => <<<'EOT'
# comment 1
header

    # comment 2
    <body>
        <h1>title</h1>
    </body>

footer # comment3
EOT
                    ,
                ),
            ),
        );
        $tests[] = array($yaml, $expected);

        $yaml = <<<'EOT'
test: |
    foo
    # bar
    baz
collection:
    - one: |
        foo
        # bar
        baz
    - two: |
        foo
        # bar
        baz
EOT;
        $expected = array(
            'test' => <<<'EOT'
foo
# bar
baz

EOT
            ,
            'collection' => array(
                array(
                    'one' => <<<'EOT'
foo
# bar
baz

EOT
                    ,
                ),
                array(
                    'two' => <<<'EOT'
foo
# bar
baz
EOT
                    ,
                ),
            ),
        );
        $tests[] = array($yaml, $expected);

        $yaml = <<<'EOT'
foo:
  bar:
    scalar-block: >
      line1
      line2>
  baz:
# comment
    foobar: ~
EOT;
        $expected = array(
            'foo' => array(
                'bar' => array(
                    'scalar-block' => "line1 line2>\n",
                ),
                'baz' => array(
                    'foobar' => null,
                ),
            ),
        );
        $tests[] = array($yaml, $expected);

        $yaml = <<<'EOT'
a:
    b: hello
#    c: |
#        first row
#        second row
    d: hello
EOT;
        $expected = array(
            'a' => array(
                'b' => 'hello',
                'd' => 'hello',
            ),
        );
        $tests[] = array($yaml, $expected);

        return $tests;
    }

    public function testBlankLinesAreParsedAsNewLinesInFoldedBlocks()
    {
        $yaml = <<<'EOT'
test: >
    <h2>A heading</h2>

    <ul>
    <li>a list</li>
    <li>may be a good example</li>
    </ul>
EOT;

        $this->assertSame(
            array(
                'test' => <<<'EOT'
<h2>A heading</h2>
<ul> <li>a list</li> <li>may be a good example</li> </ul>
EOT
                ,
            ),
            $this->parser->parse($yaml)
        );
    }

    public function testAdditionallyIndentedLinesAreParsedAsNewLinesInFoldedBlocks()
    {
        $yaml = <<<'EOT'
test: >
    <h2>A heading</h2>

    <ul>
      <li>a list</li>
      <li>may be a good example</li>
    </ul>
EOT;

        $this->assertSame(
            array(
                'test' => <<<'EOT'
<h2>A heading</h2>
<ul>
  <li>a list</li>
  <li>may be a good example</li>
</ul>
EOT
                ,
            ),
            $this->parser->parse($yaml)
        );
    }

    /**
     * @dataProvider getBinaryData
     */
    public function testParseBinaryData($data)
    {
        $this->assertSame(array('data' => 'Hello world'), $this->parser->parse($data));
    }

    public function getBinaryData()
    {
        return array(
            'enclosed with double quotes' => array('data: !!binary "SGVsbG8gd29ybGQ="'),
            'enclosed with single quotes' => array("data: !!binary 'SGVsbG8gd29ybGQ='"),
            'containing spaces' => array('data: !!binary  "SGVs bG8gd 29ybGQ="'),
            'in block scalar' => array(
                <<<'EOT'
data: !!binary |
    SGVsbG8gd29ybGQ=
EOT
    ),
            'containing spaces in block scalar' => array(
                <<<'EOT'
data: !!binary |
    SGVs bG8gd 29ybGQ=
EOT
    ),
        );
    }

    /**
     * @dataProvider getInvalidBinaryData
     * @expectedException \Symfony\Component\Yaml\Exception\ParseException
     */
    public function testParseInvalidBinaryData($data, $expectedMessage)
    {
        if (method_exists($this, 'expectException')) {
            $this->expectExceptionMessageRegExp($expectedMessage);
        } else {
            $this->setExpectedExceptionRegExp(ParseException::class, $expectedMessage);
        }

        $this->parser->parse($data);
    }

    public function getInvalidBinaryData()
    {
        return array(
            'length not a multiple of four' => array('data: !!binary "SGVsbG8d29ybGQ="', '/The normalized base64 encoded data \(data without whitespace characters\) length must be a multiple of four \(\d+ bytes given\)/'),
            'invalid characters' => array('!!binary "SGVsbG8#d29ybGQ="', '/The base64 encoded data \(.*\) contains invalid characters/'),
            'too many equals characters' => array('data: !!binary "SGVsbG8gd29yb==="', '/The base64 encoded data \(.*\) contains invalid characters/'),
            'misplaced equals character' => array('data: !!binary "SGVsbG8gd29ybG=Q"', '/The base64 encoded data \(.*\) contains invalid characters/'),
            'length not a multiple of four in block scalar' => array(
                <<<'EOT'
data: !!binary |
    SGVsbG8d29ybGQ=
EOT
                ,
                '/The normalized base64 encoded data \(data without whitespace characters\) length must be a multiple of four \(\d+ bytes given\)/',
            ),
            'invalid characters in block scalar' => array(
                <<<'EOT'
data: !!binary |
    SGVsbG8#d29ybGQ=
EOT
                ,
                '/The base64 encoded data \(.*\) contains invalid characters/',
            ),
            'too many equals characters in block scalar' => array(
                <<<'EOT'
data: !!binary |
    SGVsbG8gd29yb===
EOT
                ,
                '/The base64 encoded data \(.*\) contains invalid characters/',
            ),
            'misplaced equals character in block scalar' => array(
                <<<'EOT'
data: !!binary |
    SGVsbG8gd29ybG=Q
EOT
                ,
                '/The base64 encoded data \(.*\) contains invalid characters/',
            ),
        );
    }

    public function testParseDateAsMappingValue()
    {
        $yaml = <<<'EOT'
date: 2002-12-14
EOT;
        $expectedDate = new \DateTime();
        $expectedDate->setTimeZone(new \DateTimeZone('UTC'));
        $expectedDate->setDate(2002, 12, 14);
        $expectedDate->setTime(0, 0, 0);

        $this->assertEquals(array('date' => $expectedDate), $this->parser->parse($yaml, Yaml::PARSE_DATETIME));
    }

    /**
     * @param $lineNumber
     * @param $yaml
     * @dataProvider parserThrowsExceptionWithCorrectLineNumberProvider
     */
    public function testParserThrowsExceptionWithCorrectLineNumber($lineNumber, $yaml)
    {
        if (method_exists($this, 'expectException')) {
            $this->expectException('\Symfony\Component\Yaml\Exception\ParseException');
            $this->expectExceptionMessage(sprintf('Unexpected characters near "," at line %d (near "bar: "123",").', $lineNumber));
        } else {
            $this->setExpectedException('\Symfony\Component\Yaml\Exception\ParseException', sprintf('Unexpected characters near "," at line %d (near "bar: "123",").', $lineNumber));
        }

        $this->parser->parse($yaml);
    }

    public function parserThrowsExceptionWithCorrectLineNumberProvider()
    {
        return array(
            array(
                4,
                <<<'YAML'
foo:
    -
        # bar
        bar: "123",
YAML
            ),
            array(
                5,
                <<<'YAML'
foo:
    -
        # bar
        # bar
        bar: "123",
YAML
            ),
            array(
                8,
                <<<'YAML'
foo:
    -
        # foobar
        baz: 123
bar:
    -
        # bar
        bar: "123",
YAML
            ),
            array(
                10,
                <<<'YAML'
foo:
    -
        # foobar
        # foobar
        baz: 123
bar:
    -
        # bar
        # bar
        bar: "123",
YAML
            ),
        );
    }

    public function testParseMultiLineQuotedString()
    {
        $yaml = <<<EOT
foo: "bar
  baz
   foobar
foo"
bar: baz
EOT;

        $this->assertSame(array('foo' => 'bar baz foobar foo', 'bar' => 'baz'), $this->parser->parse($yaml));
    }

    public function testMultiLineQuotedStringWithTrailingBackslash()
    {
        $yaml = <<<YAML
foobar:
    "foo\
    bar"
YAML;

        $this->assertSame(array('foobar' => 'foobar'), $this->parser->parse($yaml));
    }

    public function testCommentCharactersInMultiLineQuotedStrings()
    {
        $yaml = <<<YAML
foo:
    foobar: 'foo
      #bar'
    bar: baz
YAML;
        $expected = array(
            'foo' => array(
                'foobar' => 'foo #bar',
                'bar' => 'baz',
            ),
        );

        $this->assertSame($expected, $this->parser->parse($yaml));
    }

    public function testBlankLinesInQuotedMultiLineString()
    {
        $yaml = <<<YAML
foobar: 'foo

    bar'
YAML;
        $expected = array(
            'foobar' => "foo\nbar",
        );

        $this->assertSame($expected, $this->parser->parse($yaml));
    }

    public function testParseMultiLineUnquotedString()
    {
        $yaml = <<<EOT
foo: bar
  baz
   foobar
  foo
bar: baz
EOT;

        $this->assertSame(array('foo' => 'bar baz foobar foo', 'bar' => 'baz'), $this->parser->parse($yaml));
    }

    public function testParseMultiLineString()
    {
        $this->assertEquals("foo bar\nbaz", $this->parser->parse("foo\nbar\n\nbaz"));
    }

    /**
     * @dataProvider multiLineDataProvider
     */
    public function testParseMultiLineMappingValue($yaml, $expected, $parseError)
    {
        $this->assertEquals($expected, $this->parser->parse($yaml));
    }

    public function multiLineDataProvider()
    {
        $tests = array();

        $yaml = <<<'EOF'
foo:
- bar:
    one

    two
    three
EOF;
        $expected = array(
            'foo' => array(
                array(
                    'bar' => "one\ntwo three",
                ),
            ),
        );

        $tests[] = array($yaml, $expected, false);

        $yaml = <<<'EOF'
bar
"foo"
EOF;
        $expected = 'bar "foo"';

        $tests[] = array($yaml, $expected, false);

        $yaml = <<<'EOF'
bar
"foo
EOF;
        $expected = 'bar "foo';

        $tests[] = array($yaml, $expected, false);

        $yaml = <<<'EOF'
bar

'foo'
EOF;
        $expected = "bar\n'foo'";

        $tests[] = array($yaml, $expected, false);

        $yaml = <<<'EOF'
bar

foo'
EOF;
        $expected = "bar\nfoo'";

        $tests[] = array($yaml, $expected, false);

        return $tests;
    }

    public function testTaggedInlineMapping()
    {
        $this->assertEquals(new TaggedValue('foo', array('foo' => 'bar')), $this->parser->parse('!foo {foo: bar}', Yaml::PARSE_CUSTOM_TAGS));
    }

    /**
     * @dataProvider taggedValuesProvider
     */
    public function testCustomTagSupport($expected, $yaml)
    {
        $this->assertEquals($expected, $this->parser->parse($yaml, Yaml::PARSE_CUSTOM_TAGS));
    }

    public function taggedValuesProvider()
    {
        return array(
            'scalars' => array(
                array(
                    'foo' => new TaggedValue('inline', 'bar'),
                    'quz' => new TaggedValue('long', 'this is a long text'),
                ),
                <<<YAML
foo: !inline bar
quz: !long >
  this is a long
  text
YAML
            ),
            'sequences' => array(
                array(new TaggedValue('foo', array('yaml')), new TaggedValue('quz', array('bar'))),
                <<<YAML
- !foo
    - yaml
- !quz [bar]
YAML
            ),
            'mappings' => array(
                new TaggedValue('foo', array('foo' => new TaggedValue('quz', array('bar')), 'quz' => new TaggedValue('foo', array('quz' => 'bar')))),
                <<<YAML
!foo
foo: !quz [bar]
quz: !foo
   quz: bar
YAML
            ),
            'inline' => array(
                array(new TaggedValue('foo', array('foo', 'bar')), new TaggedValue('quz', array('foo' => 'bar', 'quz' => new TaggedValue('bar', array('one' => 'bar'))))),
                <<<YAML
- !foo [foo, bar]
- !quz {foo: bar, quz: !bar {one: bar}}
YAML
            ),
            'spaces-around-tag-value-in-sequence' => array(
                array(new TaggedValue('foo', 'bar')),
                '[ !foo bar ]',
            ),
        );
    }

    public function testNonSpecificTagSupport()
    {
        $this->assertSame('12', $this->parser->parse('! 12'));
    }

    /**
     * @expectedException \Symfony\Component\Yaml\Exception\ParseException
     * @expectedExceptionMessage Tags support is not enabled. Enable the `Yaml::PARSE_CUSTOM_TAGS` flag to use "!iterator" at line 1 (near "!iterator [foo]").
     */
    public function testCustomTagsDisabled()
    {
        $this->parser->parse('!iterator [foo]');
    }

    /**
     * @expectedException \Symfony\Component\Yaml\Exception\ParseException
     * @expectedExceptionMessage Tags support is not enabled. Enable the `Yaml::PARSE_CUSTOM_TAGS` flag to use "!iterator" at line 1 (near "!iterator foo").
     */
    public function testUnsupportedTagWithScalar()
    {
        $this->parser->parse('!iterator foo');
    }

    /**
     * @expectedException \Symfony\Component\Yaml\Exception\ParseException
     * @expectedExceptionMessage The string "!!iterator foo" could not be parsed as it uses an unsupported built-in tag at line 1 (near "!!iterator foo").
     */
    public function testUnsupportedBuiltInTagWithScalar()
    {
        $this->parser->parse('!!iterator foo');
    }

    /**
     * @expectedException \Symfony\Component\Yaml\Exception\ParseException
     * @expectedExceptionMessage The built-in tag "!!foo" is not implemented at line 1 (near "!!foo").
     */
    public function testExceptionWhenUsingUnsuportedBuiltInTags()
    {
        $this->parser->parse('!!foo');
    }

    /**
     * @expectedException \Symfony\Component\Yaml\Exception\ParseException
     * @expectedExceptionMessage Complex mappings are not supported at line 1 (near "? "1"").
     */
    public function testComplexMappingThrowsParseException()
    {
        $yaml = <<<YAML
? "1"
:
  name: végétalien
YAML;

        $this->parser->parse($yaml);
    }

    /**
     * @expectedException \Symfony\Component\Yaml\Exception\ParseException
     * @expectedExceptionMessage Complex mappings are not supported at line 2 (near "? "1"").
     */
    public function testComplexMappingNestedInMappingThrowsParseException()
    {
        $yaml = <<<YAML
diet:
  ? "1"
  :
    name: végétalien
YAML;

        $this->parser->parse($yaml);
    }

    /**
     * @expectedException \Symfony\Component\Yaml\Exception\ParseException
     * @expectedExceptionMessage Complex mappings are not supported at line 1 (near "- ? "1"").
     */
    public function testComplexMappingNestedInSequenceThrowsParseException()
    {
        $yaml = <<<YAML
- ? "1"
  :
    name: végétalien
YAML;

        $this->parser->parse($yaml);
    }

    /**
     * @expectedException        \Symfony\Component\Yaml\Exception\ParseException
     * @expectedExceptionMessage Unable to parse at line 1 (near "[parameters]").
     */
    public function testParsingIniThrowsException()
    {
        $ini = <<<INI
[parameters]
  foo = bar
  bar = %foo%
INI;

        $this->parser->parse($ini);
    }

    private function loadTestsFromFixtureFiles($testsFile)
    {
        $parser = new Parser();

        $tests = array();
        $files = $parser->parseFile(__DIR__.'/Fixtures/'.$testsFile);
        foreach ($files as $file) {
            $yamls = file_get_contents(__DIR__.'/Fixtures/'.$file.'.yml');

            // split YAMLs documents
            foreach (preg_split('/^---( %YAML\:1\.0)?/m', $yamls) as $yaml) {
                if (!$yaml) {
                    continue;
                }

                $test = $parser->parse($yaml);
                if (isset($test['todo']) && $test['todo']) {
                    // TODO
                } else {
                    eval('$expected = '.trim($test['php']).';');

                    $tests[] = array(var_export($expected, true), $test['yaml'], $test['test']);
                }
            }
        }

        return $tests;
    }

    public function testCanParseVeryLongValue()
    {
        $longStringWithSpaces = str_repeat('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx ', 20000);
        $trickyVal = array('x' => $longStringWithSpaces);

        $yamlString = Yaml::dump($trickyVal);
        $arrayFromYaml = $this->parser->parse($yamlString);

        $this->assertEquals($trickyVal, $arrayFromYaml);
    }

    /**
     * @expectedException \Symfony\Component\Yaml\Exception\ParseException
     * @expectedExceptionMessage Reference "foo" does not exist at line 2
     */
    public function testParserCleansUpReferencesBetweenRuns()
    {
        $yaml = <<<YAML
foo: &foo
    baz: foobar
bar:
    <<: *foo
YAML;
        $this->parser->parse($yaml);

        $yaml = <<<YAML
bar:
    <<: *foo
YAML;
        $this->parser->parse($yaml);
    }

    public function testPhpConstantTagMappingKey()
    {
        $yaml = <<<YAML
transitions:
    !php/const 'Symfony\Component\Yaml\Tests\B::FOO':
        from:
            - !php/const 'Symfony\Component\Yaml\Tests\B::BAR'
        to: !php/const 'Symfony\Component\Yaml\Tests\B::BAZ'
YAML;
        $expected = array(
            'transitions' => array(
                'foo' => array(
                    'from' => array(
                        'bar',
                    ),
                    'to' => 'baz',
                ),
            ),
        );

        $this->assertSame($expected, $this->parser->parse($yaml, Yaml::PARSE_CONSTANT));
    }

    public function testMergeKeysWhenMappingsAreParsedAsObjects()
    {
        $yaml = <<<YAML
foo: &FOO
    bar: 1
bar: &BAR
    baz: 2
    <<: *FOO
baz:
    baz_foo: 3
    <<:
        baz_bar: 4
foobar:
    bar: ~
    <<: [*FOO, *BAR]
YAML;
        $expected = (object) array(
            'foo' => (object) array(
                'bar' => 1,
            ),
            'bar' => (object) array(
                'baz' => 2,
                'bar' => 1,
            ),
            'baz' => (object) array(
                'baz_foo' => 3,
                'baz_bar' => 4,
            ),
            'foobar' => (object) array(
                'bar' => null,
                'baz' => 2,
            ),
        );

        $this->assertEquals($expected, $this->parser->parse($yaml, Yaml::PARSE_OBJECT_FOR_MAP));
    }

    public function testFilenamesAreParsedAsStringsWithoutFlag()
    {
        $file = __DIR__.'/Fixtures/index.yml';

        $this->assertSame($file, $this->parser->parse($file));
    }

    public function testParseFile()
    {
        $this->assertInternalType('array', $this->parser->parseFile(__DIR__.'/Fixtures/index.yml'));
    }

    /**
     * @expectedException \Symfony\Component\Yaml\Exception\ParseException
     * @expectedExceptionMessageRegExp #^File ".+/Fixtures/nonexistent.yml" does not exist\.$#
     */
    public function testParsingNonExistentFilesThrowsException()
    {
        $this->parser->parseFile(__DIR__.'/Fixtures/nonexistent.yml');
    }

    /**
     * @expectedException \Symfony\Component\Yaml\Exception\ParseException
     * @expectedExceptionMessageRegExp #^File ".+/Fixtures/not_readable.yml" cannot be read\.$#
     */
    public function testParsingNotReadableFilesThrowsException()
    {
        if ('\\' === \DIRECTORY_SEPARATOR) {
            $this->markTestSkipped('chmod is not supported on Windows');
        }

        if (!getenv('USER') || 'root' === getenv('USER')) {
            $this->markTestSkipped('This test will fail if run under superuser');
        }

        $file = __DIR__.'/Fixtures/not_readable.yml';
        chmod($file, 0200);

        $this->parser->parseFile($file);
    }

    public function testParseReferencesOnMergeKeys()
    {
        $yaml = <<<YAML
mergekeyrefdef:
    a: foo
    <<: &quux
        b: bar
        c: baz
mergekeyderef:
    d: quux
    <<: *quux
YAML;
        $expected = array(
            'mergekeyrefdef' => array(
                'a' => 'foo',
                'b' => 'bar',
                'c' => 'baz',
            ),
            'mergekeyderef' => array(
                'd' => 'quux',
                'b' => 'bar',
                'c' => 'baz',
            ),
        );

        $this->assertSame($expected, $this->parser->parse($yaml));
    }

    public function testParseReferencesOnMergeKeysWithMappingsParsedAsObjects()
    {
        $yaml = <<<YAML
mergekeyrefdef:
    a: foo
    <<: &quux
        b: bar
        c: baz
mergekeyderef:
    d: quux
    <<: *quux
YAML;
        $expected = (object) array(
            'mergekeyrefdef' => (object) array(
                'a' => 'foo',
                'b' => 'bar',
                'c' => 'baz',
            ),
            'mergekeyderef' => (object) array(
                'd' => 'quux',
                'b' => 'bar',
                'c' => 'baz',
            ),
        );

        $this->assertEquals($expected, $this->parser->parse($yaml, Yaml::PARSE_OBJECT_FOR_MAP));
    }

    /**
     * @expectedException \Symfony\Component\Yaml\Exception\ParseException
     * @expectedExceptionMessage Reference "foo" does not exist
     */
    public function testEvalRefException()
    {
        $yaml = <<<EOE
foo: { &foo { a: Steve, <<: *foo} }
EOE;
        $this->parser->parse($yaml);
    }

    /**
     * @dataProvider indentedMappingData
     */
    public function testParseIndentedMappings($yaml, $expected)
    {
        $this->assertSame($expected, $this->parser->parse($yaml));
    }

    public function indentedMappingData()
    {
        $tests = array();

        $yaml = <<<YAML
foo:
  - bar: "foobar"
    # A comment
    baz: "foobaz"
YAML;
        $expected = array(
            'foo' => array(
                array(
                    'bar' => 'foobar',
                    'baz' => 'foobaz',
                ),
            ),
        );
        $tests['comment line is first line in indented block'] = array($yaml, $expected);

        $yaml = <<<YAML
foo:
    - bar:
        # comment
        baz: [1, 2, 3]
YAML;
        $expected = array(
            'foo' => array(
                array(
                    'bar' => array(
                        'baz' => array(1, 2, 3),
                    ),
                ),
            ),
        );
        $tests['mapping value on new line starting with a comment line'] = array($yaml, $expected);

        $yaml = <<<YAML
foo:
  -
    bar: foobar
YAML;
        $expected = array(
            'foo' => array(
                array(
                    'bar' => 'foobar',
                ),
            ),
        );
        $tests['mapping in sequence starting on a new line'] = array($yaml, $expected);

        $yaml = <<<YAML
foo:

    bar: baz
YAML;
        $expected = array(
            'foo' => array(
                'bar' => 'baz',
            ),
        );
        $tests['blank line at the beginning of an indented mapping value'] = array($yaml, $expected);

        return $tests;
    }
}

class B
{
    public $b = 'foo';

    const FOO = 'foo';
    const BAR = 'bar';
    const BAZ = 'baz';
}
