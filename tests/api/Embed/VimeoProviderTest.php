<?php

use Directus\Embed\Provider\VimeoProvider;

class VimeoProviderTest extends PHPUnit_Framework_TestCase
{
    protected $youtubeURL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    protected $vimeoURL = 'https://vimeo.com/45196609';

    public function testVimeoEmbed()
    {
        $vimeo = new VimeoProvider();

        $this->assertTrue($vimeo->validateURL($this->vimeoURL));

        $data = $vimeo->parse($this->vimeoURL);
        $this->assertInternalType('array', $data);

        $this->assertEquals($data['embed_id'], '45196609');
        $this->assertEquals($data['type'], $vimeo->getType());
        $this->assertEquals($data['type'], 'embed/vimeo');

        $data = $vimeo->parseID('45196609');
        $this->assertEquals($data['embed_id'], '45196609');
        $this->assertEquals($data['type'], $vimeo->getType());
        $this->assertEquals($data['type'], 'embed/vimeo');

        $data = $vimeo->parseID(123);
    }

    public function testExceptionVimeoEmbedInvalidParseURL()
    {
        $vimeo = new VimeoProvider();
        $this->setExpectedException('InvalidArgumentException');
        $data = $vimeo->parse($this->youtubeURL);
    }

    public function testExceptionVimeoEmbedNonStringURL()
    {
        $vimeo = new VimeoProvider();
        $this->setExpectedException('InvalidArgumentException');
        $data = $vimeo->parse(true);
    }

    public function testExceptionVimeoEmbedNoIDInURL()
    {
        $vimeo = new VimeoProvider();
        $this->setExpectedException('Exception');
        $data = $vimeo->parse('https://vimeo.com');
    }
}
