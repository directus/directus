[![CircleCI](https://circleci.com/gh/char0n/ffmpeg-php.svg?style=svg)](https://circleci.com/gh/char0n/ffmpeg-php)

# FFmpegPHP

FFmpegPHP is a pure OO [PSR-4 compatible](https://www.php-fig.org/psr/psr-4/) PHP port of [ffmpeg-php](http://ffmpeg-php.sourceforge.net/) library (written in C). It adds an easy to use,
object-oriented API for accessing and retrieving information from video and audio files.
It has methods for returning frames from movie files as images that can be manipulated
using PHP image functions. This works well for automatically creating thumbnail images from movies.
FFmpegPHP is also useful for reporting the duration and bitrate of audio files (mp3, wma...).
FFmpegPHP can access many of the video formats supported by ffmpeg (mov, avi, mpg, wmv...) 

## Drop-in replacement for ffmpeg-php

FFmpegPHP can be used as a drop in replacement for [ffmpeg-php](http://ffmpeg-php.sourceforge.net/) library.


## Documentation

FFmpegPHP API documentation can be found here http://char0n.github.io/ffmpeg-php/.

## Requirements

- PHP >=7
- PHP extensions: gd, mbstring, xml
- [ffmpeg](https://www.ffmpeg.org/) or ffprobe



## Installation

or to install via composer (http://getcomposer.org/) place the following in your `composer.json` file: ::
```json
 {
    "require": {
        "char0n/ffmpeg-php": "*"
    }
 }
```


# Using FFmpegPHP

## Object Oriented interface

FFmpegPHP is build using PSR-4 standard and it's interface is purely Object Oriented. We're using standar
OOP patterns to create our API.

```php
use Char0n\FFMpegPHP\Movie;

$movie = new Movie('/path/to/media.mpeg');
$movie->getDuration(); // => 24
```  


## Compatibility layer

On top of our OO interface, there is an additional one that provides full compatibility with original [ffmpeg-php](http://ffmpeg-php.sourceforge.net/) library.

```php
use Char0n\FFMpegPHP\Adapters\FFMpegMovie as ffmpeg_movie;

$movie = new ffmpeg_movie('/path/to/media.mpeg');
$movie->getDuration(); // => 24
```

## Author

- char0n (Vladimír Gorej)
- email: vladimir.gorej@gmail.com
- web: https://www.linkedin.com/in/vladimirgorej/


## References

- https://packagist.org/packages/char0n/ffmpeg-php
- http://github.com/char0n/ffmpeg-php
- http://ffmpeg-php.sourceforge.net/
- http://www.phpclasses.org/package/5977-PHP-Manipulate-video-files-using-the-ffmpeg-program.html
- http://freshmeat.net/projects/ffmpegphp
