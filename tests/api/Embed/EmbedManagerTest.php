<?php

use Directus\Embed\EmbedManager;

class EmbedManagerProviderTest extends PHPUnit_Framework_TestCase
{
    protected $vimeoURL = 'https://vimeo.com/45196609';
    protected $youtubeURL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

    public function testEmbedManager()
    {
        $embed = new EmbedManager();
        $this->assertNull($embed->get('youtube'));
        $this->assertNull($embed->get('vimeo'));
        $this->assertNull($embed->getByType('youtube'));
        $this->assertNull($embed->getByType('embed/vimeo'));

        $embed->register(new \Directus\Embed\Provider\YoutubeProvider());
        $this->assertNotNull($embed->get('youtube'));
        $this->assertNotNull($embed->getByType('embed/youtube'));
        $this->assertInstanceOf('\Directus\Embed\Provider\YoutubeProvider', $embed->get('youtube'));
        $this->assertInstanceOf('\Directus\Embed\Provider\YoutubeProvider', $embed->getByType('embed/youtube'));

        $embed->register(new \Directus\Embed\Provider\VimeoProvider());
        $this->assertNotNull($embed->get('vimeo'));
        $this->assertNotNull($embed->getByType('embed/vimeo'));
        $this->assertInstanceOf('\Directus\Embed\Provider\VimeoProvider', $embed->get('vimeo'));
        $this->assertInstanceOf('\Directus\Embed\Provider\VimeoProvider', $embed->getByType('embed/vimeo'));

        $data = $embed->parse($this->youtubeURL);
        $this->assertInternalType('array', $data);
        $this->assertEquals($data['embed_id'], 'dQw4w9WgXcQ');
        $this->assertEquals($data['type'], 'embed/youtube');

        $data = $embed->parse($this->vimeoURL);
        $this->assertInternalType('array', $data);
        $this->assertEquals($data['embed_id'], '45196609');
        $this->assertEquals($data['type'], 'embed/vimeo');
    }


    public function testEmptyEmbedManager()
    {
        $embed = new EmbedManager();
        $this->setExpectedException('Exception');
        $data = $embed->parse($this->vimeoURL);
    }
}
