<?php

class FunctionsTest extends PHPUnit_Framework_TestCase
{
    public function testSpecialCaps()
    {
        $text = 'I want an ipad, ipod and iphone with the latest ios';
        $expected = 'I Want An iPad, iPod And iPhone With The Latest iOS';
        $this->assertSame($expected, uc_convert($text));
    }

    public function testSSL()
    {
        $this->assertFalse(is_ssl());

        $_SERVER['HTTPS'] = 'off';
        $this->assertFalse(is_ssl());

        $_SERVER['HTTPS'] = 'on';
        $this->assertTrue(is_ssl());
    }

    public function testGetURL()
    {
        $url = get_url();
        $this->assertSame('http://localhost/', $url);

        $url = get_url('/users', 'example.local');
        $this->assertSame('http://example.local/users', $url);

        $_SERVER['HTTP_HOST'] = 'localhost';

        $url = get_url();
        $this->assertSame('http://localhost/', $url);

        $url = get_url('/users');
        $this->assertSame('http://localhost/users', $url);
    }

    public function testFind()
    {
        $array = [
            ['name' => 'john', 'age' => 1],
            ['name' => 'jane', 'age' => 2],
        ];

        $result = find($array, 'name', 'john');
        $this->assertSame('john', $result['name']);
        $this->assertNull(find($array, 'name', 'peter'));
    }

    public function testToNameValue()
    {
        $array = [
            'john' => 2300,
            'peter' => 330
        ];

        $result = to_name_value($array, null);
        $expected = [
            ['name' => 'john', 'value' => 2300],
            ['name' => 'peter', 'value' => 330]
        ];
        $this->assertSame($expected, $result);

        $result = to_name_value($array, ['status' => 1]);
        $expected = [
            ['name' => 'john', 'value' => 2300, 'status' => 1],
            ['name' => 'peter', 'value' => 330, 'status' => 1]
        ];
        $this->assertSame($expected, $result);
    }

    public function testIsNumericKeyArray()
    {
        $array = [
            'name',
            'age',
            'country'
        ];

        $this->assertTrue(is_numeric_keys_array($array));
        $this->assertFalse(is_numeric_keys_array([
            'name' => 'john',
            'age' => 1,
            'country' => 'yes'
        ]));
    }

    public function testTimezoneList()
    {
        $timezones = get_timezone_list();

        $this->assertInternalType('array', $timezones);
    }

    public function testShorthandSize()
    {
        $this->assertSame(1 * MB_IN_BYTES, convert_shorthand_size_to_bytes('1m'));
        $this->assertSame(1 * MB_IN_BYTES, convert_shorthand_size_to_bytes('1m'));
        $this->assertSame(1 * KB_IN_BYTES, convert_shorthand_size_to_bytes('1k'));
        $this->assertSame(1 * KB_IN_BYTES, convert_shorthand_size_to_bytes('1K'));
        $this->assertSame(1 * GB_IN_BYTES, convert_shorthand_size_to_bytes('1g'));
        $this->assertSame(1 * GB_IN_BYTES, convert_shorthand_size_to_bytes('1G'));
    }

    public function testGetMaxUploadSize()
    {
        $this->assertTrue(is_int(get_max_upload_size()));
    }

    public function testFindDirectories()
    {
        $this->createTempDirs();

        $directories = find_directories($this->path);

        $this->assertSame(3, count($directories));

        $this->removeTempDirs();
    }

    public function testFindFiles()
    {
        $this->createTempFiles();
        $path = $this->path;

        $filesFound = find_files($path, 0, '*');
        $this->assertSame(9, count($filesFound));

        $jsFilesFound = find_js_files($path);
        $this->assertSame(2, count($jsFilesFound));

        $htmlFilesFound = find_html_files($path);
        $this->assertSame(2, count($htmlFilesFound));

        $twigFilesFound = find_twig_files($path);
        $this->assertSame(2, count($twigFilesFound));

        $phpFilesFound = find_php_files($path);
        $this->assertSame(2, count($phpFilesFound));

        // Including subdirectories
        $filesFound = find_files($path, 0, '*', true);
        $this->assertSame(13, count($filesFound));

        $jsFilesFound = find_js_files($path, true);
        $this->assertSame(3, count($jsFilesFound));

        $htmlFilesFound = find_html_files($path, true);
        $this->assertSame(3, count($htmlFilesFound));

        $twigFilesFound = find_twig_files($path, true);
        $this->assertSame(3, count($twigFilesFound));

        $phpFilesFound = find_php_files($path, true);
        $this->assertSame(3, count($phpFilesFound));

        $this->assertInternalType('array', find_templates());

        $this->removeTempFiles();
    }

    public function testGetGravatar()
    {
        $email = 'admin@localhost';
        $s = 200;
        $d = 'identicon';
        $r = 'g';
        $avatarURL = get_gravatar($email, $s, $d, $r);
        $expected = '//www.gravatar.com/avatar/' . md5($email) . "?s=$s&d=$d&r=$r";

        $this->assertSame($expected, $avatarURL);

        $avatarImg = get_gravatar($email, $s, $d, $r, true);
        $this->assertSame('<img src="' . $expected . '" />', $avatarImg);

        $avatarImg = get_gravatar($email, $s, $d, $r, true, ['alt' => 'image']);
        $this->assertSame('<img src="' . $expected . '" alt="image" />', $avatarImg);
    }

    public function testNormalizePath()
    {
        // From WordPress tests
        // NOTE: Comment out the disk letter as we don't support that part from the borrow function
        // if we end up doing it, we have the tests
        $paths = array(
            '/WINDOWS' => '/WINDOWS',
            // 'C:/' => 'C:/',
            // 'C:/WINDOWS' => 'C:/WINDOWS',
            // 'C:/WINDOWS/system32' => 'C:/WINDOWS/system32',
            '\\WINDOWS' => '/WINDOWS',
            // 'C:\\' => 'C:/',
            // 'C:\\WINDOWS' => 'C:/WINDOWS',
            // 'C:\\\\WINDOWS' => 'C:/WINDOWS',
            // 'C:\\WINDOWS\\system32' => 'C:/WINDOWS/system32',
            '\\\\sambashare\\foo' => '/sambashare/foo',
            // 'c:/windows' => 'C:/windows',
            // 'c:\\windows' => 'C:/windows',
        );

        foreach ($paths as $original => $expected) {
            $this->assertEquals($expected, normalize_path($original));
        }
    }

    public function testColumnIdentifierReverse()
    {
        $original = 'posts.comments.author.email';
        $expected = 'email.author.comments.posts';

        $this->assertSame($expected, column_identifier_reverse($original));
    }

    public function testArrayDeep()
    {
        $array1 = [
            'one',
            'two',
            'three'
        ];

        $this->assertSame(0, \Directus\Util\ArrayUtils::deepLevel($array1));

        $array2 = [
            'one',
            'two',
            'three' => [
                'threed',
                '3d',
                'triple'
            ],
            'four' => [
                'for',
                '4'
            ]
        ];

        $this->assertSame(1, \Directus\Util\ArrayUtils::deepLevel($array2));

        $array3 = [
            'one',
            'two',
            'three' => [
                'threed',
                '3d' => [
                    '4d'
                ],
                'triple'
            ],

        ];

        $this->assertSame(2, \Directus\Util\ArrayUtils::deepLevel($array3));
    }

    public function testGetColumnsFlatAt()
    {
        $columns = [
            'zero-0',
            'zero-1.one-1',
            'zero-2',
            'zero-3.one-1.two-1',
            'zero-3.one-2'
        ];

        $this->assertSame([
            'zero-0',
            'zero-1',
            'zero-2',
            'zero-3',
            'zero-3'
        ], get_columns_flat_at($columns, 0));

        $this->assertSame([
            'one-1',
            'one-1',
            'one-2'
        ], get_columns_flat_at($columns, 1));

        $this->assertSame([
            'two-1'
        ], get_columns_flat_at($columns, 2));

        $this->assertCount(5, get_columns_flat_at($columns, 0));
        $this->assertCount(3, get_columns_flat_at($columns, 1));
        $this->assertCount(1, get_columns_flat_at($columns, 2));
    }

    public function testGetFlatColumns()
    {
        $original = [
            'one' => null,
            'two' => null,
            'three' => [
                'threed' => null,
                '3d' => null,
                'triple' => null,
                '3ple' => [
                    'double' => null
                ]
            ],
            'four' => [
                'for' => null,
                '4' => null
            ]
        ];

        $expected = [
            'one',
            'two',
            'three.threed',
            'three.3d',
            'three.triple',
            'three.3ple.double',
            'four.for',
            'four.4'
        ];

        $this->assertSame($expected, get_array_flat_columns($original));
        $this->assertSame(implode(',', $expected), get_csv_flat_columns($original));
    }

    public function testGetUnflatColumns()
    {
        $original = [
            'one',
            'two',
            'three.threed',
            'three.3d',
            'three.triple',
            'three.3ple.double',
            'four.for',
            'four.4'
        ];

        $expected = [
            'one' => null,
            'two' => null,
            'three' => [
                'threed' => null,
                '3d' => null,
                'triple' => null,
                '3ple' => [
                    'double' => null
                ]
            ],
            'four' => [
                'for' => null,
                '4' => null
            ]
        ];

        $this->assertSame($expected, get_unflat_columns($original));
        $this->assertSame($expected, get_unflat_columns(implode(',', $original)));
    }

    public function testSlugify()
    {
        $original = 'ÁÄÂÀÃÅČÇĆĎÉĚËÈÊẼĔȆÍÌÎÏŇÑÓÖÒÔÕØŘŔŠŤÚŮÜÙÛÝŸŽáäâàãåčçćďéěëèêẽĕȇíìîïňñóöòôõøðřŕšťúůüùûýÿžþÞĐđßÆa·/_,:;';
        $expected = 'aaaaaacccdeeeeeeeeiiiinnoooooorrstuuuuuyyzaaaaaacccdeeeeeeeeiiiinnooooooorrstuuuuuyyzbbddbaa-';

        $this->assertSame($expected, slugify($original));
    }

    protected $files = [
        'file.js',
        'module.js',
        'dir/index.js',
        'file.php',
        'module.php',
        'dir/index.php',
        'file.html',
        'file.twig',
        'module.html',
        'module.twig',
        'dir/index.html',
        'dir/index.twig',
    ];

    protected $path;

    public function setUp()
    {
        $this->path = __DIR__ . '/tmp';

        $this->removeTempFiles();
        $this->removeTempDirs();
    }

    protected function createTempDirs()
    {
        $path = $this->path;
        $dirs = ['one', 'two', 'three'];
        $subs = ['a', 'b', 'c', '_d', '_e'];

        // create the directory
        mkdir($path);
        file_put_contents($path . '/ignore1', '');
        file_put_contents($path . '/ignore2', '');

        // create subdirectories
        foreach ($dirs as $dir) {
            $dir = $path . '/' . $dir;
            mkdir($dir);

            foreach ($subs as $sub) {
                mkdir($dir . '/' . $sub);
            }
        }
    }

    protected function removeTempDirs()
    {
        $path = $this->path;
        $dirs = ['one', 'two', 'three'];
        $subs = ['a', 'b', 'c', '_d', '_e'];

        // remove the directories
        foreach ($dirs as $dir) {
            $dir = $path . '/' . $dir;

            // make sure to remove the subdirectory first
            // rmdir only remove empty directories
            foreach ($subs as $sub) {
                $subdir = $dir . '/' . $sub;
                if (is_dir($subdir)) {
                    rmdir($subdir);
                }
            }

            if (is_dir($dir)) {
                rmdir($dir);
            }
        }

        // remove files
        if (file_exists($path . '/ignore1')) {
            unlink($path . '/ignore1');
        }

        if (file_exists($path . '/ignore2')) {
            unlink($path . '/ignore2');
        }

        // remove main directory
        if (is_dir($path)) {
            rmdir($path);
        }
    }

    protected function createTempFiles()
    {
        $path = $this->path;
        $files = $this->files;

        if (is_dir($path)) {
            $this->removeTempFiles();
        }

        mkdir($path);
        mkdir($path . '/dir');

        foreach ($files as $file) {
            file_put_contents($path . '/' . $file, '');
        }
    }

    protected function removeTempFiles()
    {
        $path = $this->path;
        $files = $this->files;

        foreach ($files as $file) {
            $filePath = $path . '/' . $file;
            if (file_exists($filePath)) {
                unlink($filePath);
            }
        }

        if (is_dir($path . '/dir')) {
            rmdir($path . '/dir');
        }

        if (is_dir($path)) {
            rmdir($path);
        }
    }
}
