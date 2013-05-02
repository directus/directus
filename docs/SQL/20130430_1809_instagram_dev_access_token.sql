INSERT INTO `directus_settings` (`collection`, `name`, `value`)
VALUES
	('social', 'instagram_oauth_access_token', '365840848.1fb234f.00298928cce34c1fa869a5527d3d6d38'),
	('social', 'instagram_client_id', '4ee1c5a5e5194b1abd21b6891a389d49');

ALTER TABLE  `directus_social_posts` CHANGE  `foreign_id`  `foreign_id` VARCHAR( 55 ) NOT NULL;

TRUNCATE TABLE `directus_social_feeds`;

INSERT INTO `directus_social_feeds` (`type`, `last_checked`, `name`, `data`)
VALUES
	(1, '2013-04-30 19:14:20', 'soulcycle', '{\"id\":49035989,\"id_str\":\"49035989\",\"name\":\"SoulCycle\",\"screen_name\":\"soulcycle\",\"location\":\"NY, Hamptons, Los Angeles, CT \",\"description\":\"SoulCycle has revolutionized indoor cycling and taken the world of fitness by storm. 45 minutes to free your mind, work your body and find your SOUL.\",\"url\":\"http:\\/\\/soul-cycle.com\\/\",\"entities\":{\"url\":{\"urls\":[{\"url\":\"http:\\/\\/soul-cycle.com\\/\",\"expanded_url\":null,\"indices\":[0,22]}]},\"description\":{\"urls\":[]}},\"protected\":false,\"followers_count\":18726,\"friends_count\":5249,\"listed_count\":176,\"created_at\":\"Sat Jun 20 15:45:04 +0000 2009\",\"favourites_count\":1,\"utc_offset\":-18000,\"time_zone\":\"Quito\",\"geo_enabled\":false,\"verified\":false,\"statuses_count\":36737,\"lang\":\"en\",\"contributors_enabled\":false,\"is_translator\":false,\"profile_background_color\":\"FFFFFF\",\"profile_background_image_url\":\"http:\\/\\/a0.twimg.com\\/profile_background_images\\/115966311\\/Wheels.jpg\",\"profile_background_image_url_https\":\"https:\\/\\/si0.twimg.com\\/profile_background_images\\/115966311\\/Wheels.jpg\",\"profile_background_tile\":true,\"profile_image_url\":\"http:\\/\\/a0.twimg.com\\/profile_images\\/1018851256\\/THICKER_WHEEL_yellow_normal.jpg\",\"profile_image_url_https\":\"https:\\/\\/si0.twimg.com\\/profile_images\\/1018851256\\/THICKER_WHEEL_yellow_normal.jpg\",\"profile_link_color\":\"0084B4\",\"profile_sidebar_border_color\":\"C0DEED\",\"profile_sidebar_fill_color\":\"DDEEF6\",\"profile_text_color\":\"333333\",\"profile_use_background_image\":true,\"default_profile\":false,\"default_profile_image\":false,\"following\":null,\"follow_request_sent\":false,\"notifications\":null}'),
	(2, '2013-04-30 19:14:21', '26357022', '{\"username\":\"soulcycle\",\"website\":\"\",\"profile_picture\":\"http:\\/\\/images.ak.instagram.com\\/profiles\\/profile_26357022_75sq_1364949766.jpg\",\"full_name\":\"SoulCycle\",\"bio\":\"\",\"id\":\"26357022\"}');
