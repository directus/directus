<?php
namespace GraphQL\Examples\Blog\Data;

/**
 * Class DataSource
 *
 * This is just a simple in-memory data holder for the sake of example.
 * Data layer for real app may use Doctrine or query the database directly (e.g. in CQRS style)
 *
 * @package GraphQL\Examples\Blog
 */
class DataSource
{
    private static $users = [];
    private static $stories = [];
    private static $storyLikes = [];
    private static $comments = [];
    private static $storyComments = [];
    private static $commentReplies = [];
    private static $storyMentions = [];

    public static function init()
    {
        self::$users = [
            '1' => new User([
                'id' => '1',
                'email' => 'john@example.com',
                'firstName' => 'John',
                'lastName' => 'Doe'
            ]),
            '2' => new User([
                'id' => '2',
                'email' => 'jane@example.com',
                'firstName' => 'Jane',
                'lastName' => 'Doe'
            ]),
            '3' => new User([
                'id' => '3',
                'email' => 'john@example.com',
                'firstName' => 'John',
                'lastName' => 'Doe'
            ]),
        ];

        self::$stories = [
            '1' => new Story(['id' => '1', 'authorId' => '1', 'body' => '<h1>GraphQL is awesome!</h1>']),
            '2' => new Story(['id' => '2', 'authorId' => '1', 'body' => '<a>Test this</a>']),
            '3' => new Story(['id' => '3', 'authorId' => '3', 'body' => "This\n<br>story\n<br>spans\n<br>newlines"]),
        ];

        self::$storyLikes = [
            '1' => ['1', '2', '3'],
            '2' => [],
            '3' => ['1']
        ];

        self::$comments = [
            // thread #1:
            '100' => new Comment(['id' => '100', 'authorId' => '3', 'storyId' => '1', 'body' => 'Likes']),
                '110' => new Comment(['id' =>'110', 'authorId' =>'2', 'storyId' => '1', 'body' => 'Reply <b>#1</b>', 'parentId' => '100']),
                    '111' => new Comment(['id' => '111', 'authorId' => '1', 'storyId' => '1', 'body' => 'Reply #1-1', 'parentId' => '110']),
                    '112' => new Comment(['id' => '112', 'authorId' => '3', 'storyId' => '1', 'body' => 'Reply #1-2', 'parentId' => '110']),
                    '113' => new Comment(['id' => '113', 'authorId' => '2', 'storyId' => '1', 'body' => 'Reply #1-3', 'parentId' => '110']),
                    '114' => new Comment(['id' => '114', 'authorId' => '1', 'storyId' => '1', 'body' => 'Reply #1-4', 'parentId' => '110']),
                    '115' => new Comment(['id' => '115', 'authorId' => '3', 'storyId' => '1', 'body' => 'Reply #1-5', 'parentId' => '110']),
                    '116' => new Comment(['id' => '116', 'authorId' => '1', 'storyId' => '1', 'body' => 'Reply #1-6', 'parentId' => '110']),
                    '117' => new Comment(['id' => '117', 'authorId' => '2', 'storyId' => '1', 'body' => 'Reply #1-7', 'parentId' => '110']),
                '120' => new Comment(['id' => '120', 'authorId' => '3', 'storyId' => '1', 'body' => 'Reply #2', 'parentId' => '100']),
                '130' => new Comment(['id' => '130', 'authorId' => '3', 'storyId' => '1', 'body' => 'Reply #3', 'parentId' => '100']),
            '200' => new Comment(['id' => '200', 'authorId' => '2', 'storyId' => '1', 'body' => 'Me2']),
            '300' => new Comment(['id' => '300', 'authorId' => '3', 'storyId' => '1', 'body' => 'U2']),

            # thread #2:
            '400' => new Comment(['id' => '400', 'authorId' => '2', 'storyId' => '2', 'body' => 'Me too']),
            '500' => new Comment(['id' => '500', 'authorId' => '2', 'storyId' => '2', 'body' => 'Nice!']),
        ];

        self::$storyComments = [
            '1' => ['100', '200', '300'],
            '2' => ['400', '500']
        ];

        self::$commentReplies = [
            '100' => ['110', '120', '130'],
            '110' => ['111', '112', '113', '114', '115', '116', '117'],
        ];

        self::$storyMentions = [
            '1' => [
                self::$users['2']
            ],
            '2' => [
                self::$stories['1'],
                self::$users['3']
            ]
        ];
    }

    public static function findUser($id)
    {
        return isset(self::$users[$id]) ? self::$users[$id] : null;
    }

    public static function findStory($id)
    {
        return isset(self::$stories[$id]) ? self::$stories[$id] : null;
    }

    public static function findComment($id)
    {
        return isset(self::$comments[$id]) ? self::$comments[$id] : null;
    }

    public static function findLastStoryFor($authorId)
    {
        $storiesFound = array_filter(self::$stories, function(Story $story) use ($authorId) {
            return $story->authorId == $authorId;
        });
        return !empty($storiesFound) ? $storiesFound[count($storiesFound) - 1] : null;
    }

    public static function findLikes($storyId, $limit)
    {
        $likes = isset(self::$storyLikes[$storyId]) ? self::$storyLikes[$storyId] : [];
        $result = array_map(
            function($userId) {
                return self::$users[$userId];
            },
            $likes
        );
        return array_slice($result, 0, $limit);
    }

    public static function isLikedBy($storyId, $userId)
    {
        $subscribers = isset(self::$storyLikes[$storyId]) ? self::$storyLikes[$storyId] : [];
        return in_array($userId, $subscribers);
    }

    public static function getUserPhoto($userId, $size)
    {
        return new Image([
            'id' => $userId,
            'type' => Image::TYPE_USERPIC,
            'size' => $size,
            'width' => rand(100, 200),
            'height' => rand(100, 200)
        ]);
    }

    public static function findLatestStory()
    {
        return array_pop(self::$stories);
    }

    public static function findStories($limit, $afterId = null)
    {
        $start = $afterId ? (int) array_search($afterId, array_keys(self::$stories)) + 1 : 0;
        return array_slice(array_values(self::$stories), $start, $limit);
    }

    public static function findComments($storyId, $limit = 5, $afterId = null)
    {
        $storyComments = isset(self::$storyComments[$storyId]) ? self::$storyComments[$storyId] : [];

        $start = isset($after) ? (int) array_search($afterId, $storyComments) + 1 : 0;
        $storyComments = array_slice($storyComments, $start, $limit);

        return array_map(
            function($commentId) {
                return self::$comments[$commentId];
            },
            $storyComments
        );
    }

    public static function findReplies($commentId, $limit = 5, $afterId = null)
    {
        $commentReplies = isset(self::$commentReplies[$commentId]) ? self::$commentReplies[$commentId] : [];

        $start = isset($after) ? (int) array_search($afterId, $commentReplies) + 1: 0;
        $commentReplies = array_slice($commentReplies, $start, $limit);

        return array_map(
            function($replyId) {
                return self::$comments[$replyId];
            },
            $commentReplies
        );
    }

    public static function countComments($storyId)
    {
        return isset(self::$storyComments[$storyId]) ? count(self::$storyComments[$storyId]) : 0;
    }

    public static function countReplies($commentId)
    {
        return isset(self::$commentReplies[$commentId]) ? count(self::$commentReplies[$commentId]) : 0;
    }

    public static function findStoryMentions($storyId)
    {
        return isset(self::$storyMentions[$storyId]) ? self::$storyMentions[$storyId] :[];
    }
}
