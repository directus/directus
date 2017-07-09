---
layout: default
permalink: /plugins/
title: Plugins
---

# Plugins
Need a feature which is not included in Flysystem's bag of tricks? Write a plugin!

~~~ php
use League\Flysystem\FilesystemInterface;
use League\Flysystem\PluginInterface;

class MaximusAwesomeness implements PluginInterface
{
    protected $filesystem;

    public function setFilesystem(FilesystemInterface $filesystem)
    {
        $this->filesystem = $filesystem;
    }

    public function getMethod()
    {
        return 'getDown';
    }

    public function handle($path = null)
    {
        $contents = $this->filesystem->read($path);

        return sha1($contents);
    }
}
~~~

Now we're ready to use the plugin

~~~ php
use League\Flysystem\Filesystem;
use League\Flysystem\Adapter;

$filesystem = new Filesystem(new Adapter\Local(__DIR__.'/path/to/files/'));
$filesystem->addPlugin(new MaximusAwesomeness);
$sha1 = $filesystem->getDown('path/to/file');
~~~
