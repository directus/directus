<?php

namespace Char0n\FFMpegPHP;

use Char0n\FFMpegPHP\OutputProviders\FFMpegProvider;
use Char0n\FFMpegPHP\OutputProviders\OutputProvider;

/**
 * Represents a movie file.
 */
class Movie implements \Serializable
{

    protected static $REGEX_DURATION = '/Duration: (\d{2}):(\d{2}):(\d{2})(\.(\d+))?/';
    protected static $REGEX_FRAME_RATE = '/([0-9\.]+\sfps,\s)?([0-9\.]+)\stb(?:r|n)/';
    protected static $REGEX_COMMENT = '/comment\s*(:|=)\s*(.+)/i';
    protected static $REGEX_TITLE = '/title\s*(:|=)\s*(.+)/i';
    protected static $REGEX_ARTIST = '/(artist|author)\s*(:|=)\s*(.+)/i';
    protected static $REGEX_COPYRIGHT = '/copyright\s*(:|=)\s*(.+)/i';
    protected static $REGEX_GENRE = '/genre\s*(:|=)\s*(.+)/i';
    protected static $REGEX_TRACK_NUMBER = '/track\s*(:|=)\s*(.+)/i';
    protected static $REGEX_YEAR = '/year\s*(:|=)\s*(.+)/i';
    protected static $REGEX_FRAME_WH = '/Video:.+?([1-9]\d*)x([1-9]\d*)/';
    protected static $REGEX_PIXEL_FORMAT = '/Video: [^,]+, ([^,]+)/';
    protected static $REGEX_PIXEL_ASPECT_RATIO = '/Video:.+DAR (\d+):(\d+)\]/';
    protected static $REGEX_BITRATE = '/bitrate: (\d+) kb\/s/';
    protected static $REGEX_VIDEO_BITRATE = '/Video:.+?(\d+) kb\/s/';
    protected static $REGEX_AUDIO_BITRATE = '/Audio:.+?(\d+) kb\/s/';
    protected static $REGEX_AUDIO_SAMPLE_RATE = '/Audio:.+?(\d+) Hz/';
    protected static $REGEX_VIDEO_CODEC = '/Video:\s([^,]+),/';
    protected static $REGEX_AUDIO_CODEC = '/Audio:\s([^,]+),/';
    protected static $REGEX_AUDIO_CHANNELS = '/Audio:\s[^,]+,[^,]+,([^,]+)/';
    protected static $REGEX_HAS_AUDIO = '/Stream.+Audio/';
    protected static $REGEX_HAS_VIDEO = '/Stream.+Video/';
    protected static $REGEX_ROTATION = '/rotate\s*[:=]\s*(-?[0-9]+)/';
    protected static $REGEX_ERRORS = '/.*(Error|Permission denied|could not seek to position|Invalid pixel
         format|Unknown encoder|could not find codec|does not contain any stream).*/i';

    /**
     * Path to `ffmpeg` binary.
     *
     * @var string
     */
    protected $ffmpegBinary;

    /**
     * Output provider instance.
     *
     * @var OutputProvider
     */
    protected $provider;

    /**
     * Movie file path
     *
     * @var string
     */
    protected $movieFile;

    /**
     * Output providers output as string.
     *
     * @var string
     */
    protected $output;

    /**
     * Movie duration in seconds.
     *
     * @var float
     */
    protected $duration;

    /**
     * Current frame index
     *
     * @var int
     */
    protected $frameCount;
    /**
     * Movie frame rate.
     *
     * @var float
     */

    protected $frameRate;
    /**
     * Comment ID3 field.
     *
     * @var string
     */

    protected $comment;
    /**
     * Title ID3 field.
     *
     * @var string
     */

    protected $title;
    /**
     * Author ID3 field.
     *
     * @var string
     */

    protected $artist;
    /**
     * Copyright ID3 field.
     *
     * @var string
     */

    protected $copyright;
    /**
     * Genre ID3 field.
     *
     * @var string
     */

    protected $genre;
    /**
     * Track ID3 field.
     *
     * @var int
     */

    protected $trackNumber;
    /**
     * Year ID3 field.
     *
     * @var int
     */
    protected $year;

    /**
     * Movie frame height.
     *
     * @var int
     */
    protected $frameHeight;

    /**
     * Movie frame width.
     *
     * @var int
     */
    protected $frameWidth;

    /**
     * Movie pixel format.
     *
     * @var string
     */
    protected $pixelFormat;

    /**
     * Movie pixel aspect ratio.
     *
     * @var float
     */
    protected $pixelAspectRatio;

    /**
     * Movie bit rate combined with audio bit rate.
     *
     * @var int
     */
    protected $bitRate;

    /**
     * Movie video stream bit rate.
     *
     * @var int
     */
    protected $videoBitRate;

    /**
     * Movie audio stream bit rate.
     *
     * @var int
     */
    protected $audioBitRate;

    /**
     * Audio sample rate.
     *
     * @var int
     */
    protected $audioSampleRate;

    /**
     * Current frame number.
     *
     * @var int
     */
    protected $frameNumber;

    /**
     * Movie video codec.
     *
     * @var string
     */
    protected $videoCodec;

    /**
     * Movie audio codec.
     *
     * @var string
     */
    protected $audioCodec;

    /**
     * Movie audio channels.
     *
     * @var int
     */

    protected $audioChannels;

    /**
     * Movie rotation.
     *
     * @var int
     */
    protected $rotation;

    /**
     * Open a video or audio file and return it as an Movie object.
     * If ffmpeg and ffprobe are both installed on host system, ffmpeg
     * gets priority in extracting info from the movie file. However
     * to override this default behaviour use any implementation of OutputProviderInterface
     * as the second constructor argument while instantiating
     *
     *
     * @param string $moviePath Full path to the movie file.
     * @param OutputProvider $outputProvider Provides parsable output.
     * @param string $ffmpegBinary `ffmpeg` executable, if $outputProvider not specified.
     *
     * @throws \Exception
     */
    public function __construct($moviePath, OutputProvider $outputProvider = null, $ffmpegBinary = 'ffmpeg')
    {
        $this->movieFile = $moviePath;
        $this->frameNumber = 0;
        $this->ffmpegBinary = $ffmpegBinary;
        if ($outputProvider === null) {
            $outputProvider = new FFMpegProvider($ffmpegBinary);
        }
        $this->setProvider($outputProvider);
    }

    /**
     * Setting output provider implementation.
     *
     * @param OutputProvider $outputProvider
     *
     * @return $this
     */
    public function setProvider(OutputProvider $outputProvider)
    {
        $this->provider = $outputProvider;
        $this->provider->setMovieFile($this->movieFile);
        $this->output = $this->provider->getOutput();

        return $this;
    }

    /**
     * Getting current output provider implementation.
     *
     * @return OutputProvider
     */
    public function getProvider()
    {
        return $this->provider;
    }

    /**
     * Return the duration of a movie or audio file in seconds.
     *
     * @return float Movie duration in seconds.
     */
    public function getDuration()
    {
        if ($this->duration === null) {
            $match = [];
            preg_match(self::$REGEX_DURATION, $this->output, $match);
            if (array_key_exists(1, $match) && array_key_exists(2, $match) && array_key_exists(3, $match)) {
                $hours = (int)$match[1];
                $minutes = (int)$match[2];
                $seconds = (int)$match[3];
                $fractions = (float)(array_key_exists(5, $match) ? '0.'.$match[5] : 0.0);

                $this->duration = (($hours * 3600) + ($minutes * 60) + $seconds + $fractions);
            } else {
                $this->duration = 0.0;
            }

            return $this->duration;
        }

        return $this->duration;
    }

    /**
     * Return the number of frames in a movie or audio file.
     *
     * @return int
     */
    public function getFrameCount()
    {
        if ($this->frameCount === null) {
            $this->frameCount = (int)($this->getDuration() * $this->getFrameRate());
        }

        return $this->frameCount;
    }

    /**
     * Return the frame rate of a movie in fps.
     *
     * @return float
     */
    public function getFrameRate()
    {
        if ($this->frameRate === null) {
            $match = [];
            preg_match(self::$REGEX_FRAME_RATE, $this->output, $match);
            $this->frameRate = (float)(array_key_exists(1, $match) ? $match[1] : 0.0);
        }

        return $this->frameRate;
    }

    /**
     * Return the path and name of the movie file or audio file.
     *
     * @return string
     */
    public function getFilename()
    {
        return $this->movieFile;
    }

    /**
     * Return the comment field from the movie or audio file.
     *
     * @return string
     */
    public function getComment()
    {
        if ($this->comment === null) {
            $match = [];
            preg_match(self::$REGEX_COMMENT, $this->output, $match);
            $this->comment = array_key_exists(2, $match) ? trim($match[2]) : '';
        }

        return $this->comment;
    }

    /**
     * Return the title field from the movie or audio file.
     *
     * @return string
     */
    public function getTitle()
    {
        if ($this->title === null) {
            $match = [];
            preg_match(self::$REGEX_TITLE, $this->output, $match);
            $this->title = array_key_exists(2, $match) ? trim($match[2]) : '';
        }

        return $this->title;
    }

    /**
     * Return the author field from the movie or the artist ID3 field from an mp3 file; alias $movie->getArtist()
     *
     * @return string
     */
    public function getArtist()
    {
        if ($this->artist === null) {
            $match = [];
            preg_match(self::$REGEX_ARTIST, $this->output, $match);
            $this->artist = array_key_exists(3, $match) ? trim($match[3]) : '';
        }

        return $this->artist;
    }

    /**
     * Return the author field from the movie or the artist ID3 field from an mp3 file.
     *
     * @return string
     */
    public function getAuthor()
    {
        return $this->getArtist();
    }

    /**
     * Return the copyright field from the movie or audio file.
     *
     * @return string
     */
    public function getCopyright()
    {
        if ($this->copyright === null) {
            $match = [];
            preg_match(self::$REGEX_COPYRIGHT, $this->output, $match);
            $this->copyright = array_key_exists(2, $match) ? trim($match[2]) : '';
        }

        return $this->copyright;
    }

    /**
     * Return the genre ID3 field from an mp3 file.
     *
     * @return string
     */
    public function getGenre()
    {
        if ($this->genre === null) {
            $match = [];
            preg_match(self::$REGEX_GENRE, $this->output, $match);
            $this->genre = array_key_exists(2, $match) ? trim($match[2]) : '';
        }

        return $this->genre;
    }

    /**
     * Return the track ID3 field from an mp3 file.
     *
     * @return int
     */
    public function getTrackNumber()
    {
        if ($this->trackNumber === null) {
            $match = [];
            preg_match(self::$REGEX_TRACK_NUMBER, $this->output, $match);
            $this->trackNumber = (int)(array_key_exists(2, $match) ? $match[2] : 0);
        }

        return $this->trackNumber;
    }

    /**
     * Return the year ID3 field from an mp3 file.
     *
     * @return int
     */
    public function getYear()
    {
        if ($this->year === null) {
            $match = [];
            preg_match(self::$REGEX_YEAR, $this->output, $match);
            $this->year = (int)(array_key_exists(2, $match) ? $match[2] : 0);
        }

        return $this->year;
    }

    /**
     * Return the height of the movie in pixels.
     *
     * @return int
     */
    public function getFrameHeight()
    {
        if (null === $this->frameHeight) {
            $match = [];
            preg_match(self::$REGEX_FRAME_WH, $this->output, $match);
            if (array_key_exists(1, $match) && array_key_exists(2, $match)) {
                $this->frameWidth = (int)$match[1];
                $this->frameHeight = (int)$match[2];
            } else {
                $this->frameWidth = 0;
                $this->frameHeight = 0;
            }
        }

        return $this->frameHeight;
    }

    /**
     * Return the width of the movie in pixels.
     *
     * @return int
     */
    public function getFrameWidth()
    {
        if ($this->frameWidth === null) {
            $this->getFrameHeight();
        }

        return $this->frameWidth;
    }

    /**
     * Return the pixel format of the movie.
     *
     * @return string
     */
    public function getPixelFormat()
    {
        if ($this->pixelFormat === null) {
            $match = [];
            preg_match(self::$REGEX_PIXEL_FORMAT, $this->output, $match);
            $this->pixelFormat = array_key_exists(1, $match) ? trim($match[1]) : '';
        }

        return $this->pixelFormat;
    }

    /**
     * Return the pixel aspect ratio of the movie.
     *
     * @return float
     */
    public function getPixelAspectRatio()
    {
        if ($this->pixelAspectRatio === null) {
            $match = [];
            preg_match(self::$REGEX_PIXEL_ASPECT_RATIO, $this->output, $match);
            $this->pixelAspectRatio = (array_key_exists(1, $match) && array_key_exists(
                    2,
                    $match
                )) ? ($match[1] / $match[2]) : 0;
        }

        return $this->pixelAspectRatio;
    }

    /**
     * Return the rotation angle of the movie.
     *
     * @return int
     */
    public function getRotation()
    {
        if ($this->rotation === null) {
            $match = array();
            preg_match(self::$REGEX_ROTATION, $this->output, $match);
            $this->rotation = (array_key_exists(1, $match)) ? intval(trim($match[1])) : 0;
        }
        return $this->rotation;
    }

    /**
     * Return the bit rate of the movie or audio file in bits per second.
     *
     * @return int
     */
    public function getBitRate()
    {
        if ($this->bitRate === null) {
            $match = [];
            preg_match(self::$REGEX_BITRATE, $this->output, $match);
            $this->bitRate = (int)(array_key_exists(1, $match) ? ($match[1] * 1000) : 0);
        }

        return $this->bitRate;
    }

    /**
     * Return the bit rate of the video in bits per second.
     *
     * NOTE: This only works for files with constant bit rate.
     *
     * @return int
     */
    public function getVideoBitRate()
    {
        if ($this->videoBitRate === null) {
            $match = [];
            preg_match(self::$REGEX_VIDEO_BITRATE, $this->output, $match);
            $this->videoBitRate = (int)(array_key_exists(1, $match) ? ($match[1] * 1000) : 0);
        }

        return $this->videoBitRate;
    }

    /**
     * Return the audio bit rate of the media file in bits per second.
     *
     * @return int
     */
    public function getAudioBitRate()
    {
        if ($this->audioBitRate === null) {
            $match = [];
            preg_match(self::$REGEX_AUDIO_BITRATE, $this->output, $match);
            $this->audioBitRate = (int)(array_key_exists(1, $match) ? ($match[1] * 1000) : 0);
        }

        return $this->audioBitRate;
    }

    /**
     * Return the audio sample rate of the media file in bits per second.
     *
     * @return int
     */
    public function getAudioSampleRate()
    {
        if ($this->audioSampleRate === null) {
            $match = [];
            preg_match(self::$REGEX_AUDIO_SAMPLE_RATE, $this->output, $match);
            $this->audioSampleRate = (int)(array_key_exists(1, $match) ? $match[1] : 0);
        }

        return $this->audioSampleRate;
    }

    /**
     * Return the current frame index.
     *
     * @return int
     */
    public function getFrameNumber()
    {
        return (0 === $this->frameNumber) ? 1 : $this->frameNumber;
    }

    /**
     * Return the name of the video codec used to encode this movie.
     *
     * @return string
     */
    public function getVideoCodec()
    {
        if ($this->videoCodec === null) {
            $match = [];
            preg_match(self::$REGEX_VIDEO_CODEC, $this->output, $match);
            $this->videoCodec = array_key_exists(1, $match) ? trim($match[1]) : '';
        }

        return $this->videoCodec;
    }

    /**
     * Return the name of the audio codec used to encode this movie.
     *
     * @return string
     */
    public function getAudioCodec()
    {
        if ($this->audioCodec === null) {
            $match = [];
            preg_match(self::$REGEX_AUDIO_CODEC, $this->output, $match);
            $this->audioCodec = array_key_exists(1, $match) ? trim($match[1]) : '';
        }

        return $this->audioCodec;
    }

    /**
     * Return the number of audio channels in this movie.
     *
     * @return int
     */
    public function getAudioChannels()
    {
        if ($this->audioChannels === null) {
            $match = [];
            preg_match(self::$REGEX_AUDIO_CHANNELS, $this->output, $match);
            if (array_key_exists(1, $match)) {
                switch (trim($match[1])) {
                    case 'mono':
                        $this->audioChannels = 1;
                        break;
                    case 'stereo':
                        $this->audioChannels = 2;
                        break;
                    case '5.1':
                        $this->audioChannels = 6;
                        break;
                    case '5:1':
                        $this->audioChannels = 6;
                        break;
                    default:
                        $this->audioChannels = (int)$match[1];
                }
            } else {
                $this->audioChannels = 0;
            }
        }

        return $this->audioChannels;
    }

    /**
     * Return boolean value indicating whether the movie has an audio stream.
     *
     * @return boolean
     */
    public function hasAudio()
    {
        return (boolean)preg_match(self::$REGEX_HAS_AUDIO, $this->output);
    }

    /**
     * Return boolean value indicating whether the movie has a video stream.
     *
     * @return boolean
     */
    public function hasVideo()
    {
        return (boolean)preg_match(self::$REGEX_HAS_VIDEO, $this->output);
    }

    /**
     * Returns a frame from the movie as an Frame object. Returns false if the frame was not found.
     *
     * @param int $frameNumber Frame from the movie to return. If no frame number is specified,
     *                         returns the next frame of the movie.
     * @param int $width
     * @param int $height
     * @param int $quality
     *
     * @return Frame|boolean
     */
    public function getFrame($frameNumber = null, $width = null, $height = null, $quality = null)
    {
        $framePos = ($frameNumber === null) ? $this->frameNumber : (((int)$frameNumber) - 1);

        // Frame position out of range
        if (!is_numeric($framePos) || $framePos < 0 || $framePos > $this->getFrameCount()) {
            return false;
        }

        $frameTime = round(($framePos / $this->getFrameCount()) * $this->getDuration(), 4);

        $frame = $this->getFrameAtTime($frameTime, $width, $height, $quality);

        // Increment internal frame number
        if ($frameNumber === null) {
            ++$this->frameNumber;
        }

        return $frame;
    }

    /**
     * Returns a frame from the movie as a Frame object. Returns false if the frame was not found.
     *
     * @param float  $seconds
     * @param int    $width
     * @param int    $height
     * @param int    $quality
     * @param string $frameFilePath
     * @param array  $output
     *
     * @throws \RuntimeException
     *
     * @return Frame|boolean
     */
    public function getFrameAtTime(
        $seconds = null,
        $width = null,
        $height = null,
        $quality = null,
        $frameFilePath = null,
        &$output = null
    ) {
        // set frame position for frame extraction
        $frameTime = ($seconds === null) ? 0 : $seconds;


        // time out of range
        if (!is_numeric($frameTime) || $frameTime < 0 || $frameTime > $this->getDuration()) {
            throw new \RuntimeException(
                'Frame time is not in range '.$frameTime.'/'.$this->getDuration().' '.$this->getFilename()
            );
        }

        $image_size = '';
        if (is_numeric($height) && is_numeric($width)) {
            $image_size = ' -s '.$width.'x'.$height;
        }

        $qualityCommand = '';
        if (is_numeric($quality)) {
            $qualityCommand = ' -qscale '.$quality;
        }

        $deleteTmp = false;
        if ($frameFilePath === null) {
            $frameFilePath = sys_get_temp_dir().DIRECTORY_SEPARATOR.uniqid('frame', true).'.jpg';
            $deleteTmp = true;
        }

        $output = [];

        // Fast and accurate way to seek. First quick-seek before input up to
        // a point just before the frame, and then accurately seek after input
        // to the exact point.
        // See: http://ffmpeg.org/trac/ffmpeg/wiki/Seeking%20with%20FFmpeg
        if ($frameTime > 30) {
            $seek1 = $frameTime - 30;
            $seek2 = 30;
        } else {
            $seek1 = 0;
            $seek2 = $frameTime;
        }

        exec(
            implode(
                ' ',
                [
                    $this->ffmpegBinary,
                    '-ss '.$seek1,
                    '-i '.escapeshellarg($this->movieFile),
                    '-f image2',
                    '-ss '.$seek2,
                    '-vframes 1',
                    $image_size,
                    $qualityCommand,
                    escapeshellarg($frameFilePath),
                    '2>&1',
                ]
            ),
            $output,
            $retVar
        );
        /** @noinspection ReferenceMismatchInspection */
        $stringOutput = implode(PHP_EOL, $output);

        // Cannot write frame to the data storage
        if (!file_exists($frameFilePath)) {
            // Find error in output
            preg_match(self::$REGEX_ERRORS, $stringOutput, $errors);
            if ($errors) {
                throw new \RuntimeException($errors[0]);
            }
            // Default file not found error
            throw new \RuntimeException('TMP image not found/written '.$frameFilePath);
        }

        // Create gdimage and delete temporary image
        $imageSize = getimagesize($frameFilePath);
        switch ($imageSize[2]) {
            case IMAGETYPE_GIF:
                $gdImage = imagecreatefromgif($frameFilePath);
                break;
            case IMAGETYPE_PNG:
                $gdImage = imagecreatefrompng($frameFilePath);
                break;
            default:
                $gdImage = imagecreatefromjpeg($frameFilePath);
        }

        if ($deleteTmp && is_writable($frameFilePath)) {
            unlink($frameFilePath);
        }

        $frame = new Frame($gdImage, $frameTime);
        imagedestroy($gdImage);

        return $frame;
    }

    /**
     * Returns the next key frame from the movie as an Frame object. Returns false if the frame was not found.
     *
     * @return Frame|boolean
     */
    public function getNextKeyFrame()
    {
        return $this->getFrame();
    }

    public function __clone()
    {
        $this->provider = clone $this->provider;
    }

    /**
     * String representation of a Movie.
     *
     * @return string Rhe string representation of the object or null.
     */
    public function serialize()
    {
        $data = serialize(
            [
                $this->ffmpegBinary,
                $this->movieFile,
                $this->output,
                $this->frameNumber,
                $this->provider,
            ]
        );

        return $data;
    }

    /**
     * Constructs the Movie from serialized data.
     *
     * @param string $serialized The string representation of Movie instance.
     *
     * @return void
     */
    public function unserialize($serialized)
    {
        list(
            $this->ffmpegBinary,
            $this->movieFile,
            $this->output,
            $this->frameNumber,
            $this->provider
        ) = unserialize($serialized);
    }
}
