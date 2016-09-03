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

    public function testFindFiles()
    {
        $this->createTempFiles();
        $path = $this->path;

        $filesFound = find_files($path, 0, '*');
        $this->assertSame(7, count($filesFound));

        $jsFilesFound = find_js_files($path);
        $this->assertSame(2, count($jsFilesFound));

        $htmlFilesFound = find_html_files($path);
        $this->assertSame(2, count($htmlFilesFound));

        $phpFilesFound = find_php_files($path);
        $this->assertSame(2, count($phpFilesFound));

        // Including subdirectories
        $filesFound = find_files($path, 0, '*', true);
        $this->assertSame(10, count($filesFound));

        $jsFilesFound = find_js_files($path, true);
        $this->assertSame(3, count($jsFilesFound));

        $htmlFilesFound = find_html_files($path, true);
        $this->assertSame(3, count($htmlFilesFound));

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

    protected $files = [
        'file.js',
        'module.js',
        'dir/index.js',
        'file.php',
        'module.php',
        'dir/index.php',
        'file.html',
        'module.html',
        'dir/index.html',
    ];

    protected $path;

    public function setUp()
    {
        $this->path = __DIR__ . '/tmp';
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
            unlink($path . '/' . $file);
        }

        rmdir($path . '/dir');
        rmdir($path);
    }
}
