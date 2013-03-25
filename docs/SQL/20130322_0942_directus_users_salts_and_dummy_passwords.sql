--
-- Salts and Dummy Passwords
--
-- This assigns each user a dummy password consisting of the concatenation of
-- the word "password" and their LOWERCASE first name, i.e. Abby's password
-- would be "passwordabby".
--

UPDATE `directus_users` SET `password` = 'abc9c55075babd72c842134ede610fb2a9a8d4c1', `salt` = '514c5be378c58' WHERE `directus_users`.`id` = 6;
UPDATE `directus_users` SET `password` = '8ed11a3374fe657a077d4caf275974301ea7fce6', `salt` = '514c5be0dffa9' WHERE `directus_users`.`id` = 2;
UPDATE `directus_users` SET `password` = '43fd7bd5c6a0a9ae3c701d435d44a1dadd0625e1', `salt` = '514c5be1aed8d' WHERE `directus_users`.`id` = 3;
UPDATE `directus_users` SET `password` = '021ac2a92752020fca43c8ebb42398332a75e920', `salt` = '514c5be267e43' WHERE `directus_users`.`id` = 4;
UPDATE `directus_users` SET `password` = '6a9db215d6449ebd79d9c633efeccbb1cd833b64', `salt` = '514c5be30ae9d' WHERE `directus_users`.`id` = 5;
UPDATE `directus_users` SET `password` = '90dcb187c22f6bf4f8c3d422dad170ff5870c363', `salt` = '514c5bdf61149' WHERE `directus_users`.`id` = 1;

-- Δ
-- email / pass
-- - - - - - - -
-- abby.kohn@soul-cycle.com / passwordabby
-- ben@rngr.org / passwordben
-- dwandrey@ideo.com / passworddann
-- olov@rngr.org / passwordolov
-- lasha@rngr.org / passwordlasha
-- max.glantzman@soul-cycle.com / passwordmax