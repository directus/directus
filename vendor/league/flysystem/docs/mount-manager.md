---
layout: default
permalink: /mount-manager/
title: Mount Manager
---

# Mount Manager

Flysystem comes with a wrapper class to easily work with multiple file system instances
from a single object. The `League\Flysystem\MountManager` is an easy to use container allowing
you to simplify more complex cross file system interactions.

Setting up a Mount Manager is easy:

~~~ php
$ftp = new League\Flysystem\Filesystem($ftpAdapter);
$s3 = new League\Flysystem\Filesystem($s3Adapter);
$local = new League\Flysystem\Filesystem($localAdapter);

// Add them in the constructor
$manager = new League\Flysystem\MountManager([
    'ftp' => $ftp,
    's3' => $s3,
]);

// Or mount them later
$manager->mountFilesystem('local', $local);
~~~

Now we do all the file operations we'd normally do on a `Flysystem\Filesystem` instance.

~~~ php
// Read from FTP
$contents = $manager->read('ftp://some/file.txt');

// And write to local
$manager->write('local://put/it/here.txt', $contents);
~~~

This makes it easy to code up simple sync strategies.

~~~ php
$contents = $manager->listContents('local://uploads', true);

foreach ($contents as $entry) {
    $update = false;

    if ( ! $manager->has('storage://'.$entry['path'])) {
        $update = true;
    } elseif ($manager->getTimestamp('local://'.$entry['path']) > $manager->getTimestamp('storage://'.$entry['path'])) {
        $update = true;
    }

    if ($update) {
        $manager->put('storage://'.$entry['path'], $manager->read('local://'.$entry['path']));
    }
}
~~~

## Specialized calls

### Copy

The copy method provided by the Mount Manager takes the origin of the file into account.
When it detects the source and destination are located on a different file systems it'll
use a streamed upload instead, transparently.

~~~ php
$mountManager->copy('local://some/file.ext', 'backup://storage/location.ext');
~~~

### Move

The `move` call is the multi-file system counterpart to `rename`. Where rename must be used on
the same file system, the `move` call provides the same conceptual behavior, but then on two
different file systems.

~~~ php
$mountManager->move('local://some/upload.jpeg', 'cdn://users/1/profile-picture.jpeg');
~~~
