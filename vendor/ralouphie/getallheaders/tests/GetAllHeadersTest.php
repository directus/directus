<?php

class GetAllHeadersTest extends \PHPUnit_Framework_TestCase
{

    /**
     * @dataProvider testWorksData
     */
    public function testWorks($test_type, $expected, $server)
    {
        foreach ($server as $key => $val) {
            $_SERVER[$key] = $val;
        }
        $result = getallheaders();
        $this->assertEquals($expected, $result, "Error testing $test_type works.");
    }

    public function testWorksData()
    {
        return array(
            array(
                'normal case',
                array(
                    'Key-One'                 => 'foo',
                    'Key-Two'                 => 'bar',
                    'Another-Key-For-Testing' => 'baz'
                ),
                array(
                    'HTTP_KEY_ONE'                 => 'foo',
                    'HTTP_KEY_TWO'                 => 'bar',
                    'HTTP_ANOTHER_KEY_FOR_TESTING' => 'baz'
                )
            ),
            array(
                'Content-Type',
                array(
                    'Content-Type' => 'two'
                ),
                array(
                    'HTTP_CONTENT_TYPE' => 'one',
                    'CONTENT_TYPE'      => 'two'
                )
            ),
            array(
                'Content-Length',
                array(
                    'Content-Length' => '222'
                ),
                array(
                    'CONTENT_LENGTH'      => '222',
                    'HTTP_CONTENT_LENGTH' => '111'
                )
            ),
            array(
                'Content-Length (HTTP_CONTENT_LENGTH only)',
                array(
                    'Content-Length' => '111'
                ),
                array(
                    'HTTP_CONTENT_LENGTH' => '111'
                )
            ),
            array(
                'Content-MD5',
                array(
                    'Content-Md5' => 'aef123'
                ),
                array(
                    'CONTENT_MD5'      => 'aef123',
                    'HTTP_CONTENT_MD5' => 'fea321'
                )
            ),
            array(
                'Content-MD5 (HTTP_CONTENT_MD5 only)',
                array(
                    'Content-Md5' => 'f123'
                ),
                array(
                    'HTTP_CONTENT_MD5' => 'f123'
                )
            ),
            array(
                'Authorization (normal)',
                array(
                    'Authorization' => 'testing'
                ),
                array(
                    'HTTP_AUTHORIZATION' => 'testing',
                )
            ),
            array(
                'Authorization (redirect)',
                array(
                    'Authorization' => 'testing redirect'
                ),
                array(
                    'REDIRECT_HTTP_AUTHORIZATION' => 'testing redirect',
                )
            ),
            array(
                'Authorization (PHP_AUTH_USER + PHP_AUTH_PW)',
                array(
                    'Authorization' => 'Basic ' . base64_encode('foo:bar')
                ),
                array(
                    'PHP_AUTH_USER' => 'foo',
                    'PHP_AUTH_PW'   => 'bar'
                )
            ),
            array(
                'Authorization (PHP_AUTH_DIGEST)',
                array(
                    'Authorization' => 'example-digest'
                ),
                array(
                    'PHP_AUTH_DIGEST' => 'example-digest'
                )
            )
        );
    }
}
