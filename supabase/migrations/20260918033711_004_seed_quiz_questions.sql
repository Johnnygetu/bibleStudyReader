/*
# Seed quiz questions (weeks 1-4)
5 questions per week covering Genesis through Joshua.
*/

INSERT INTO quiz_questions (week_number, question_text, option_a, option_b, option_c, option_d, correct_option) VALUES
-- Week 1: Genesis 1-49
(1,'In how many days did God create the heavens and the earth?','Six days','Seven days','Five days','Ten days','a'),
(1,'What did God use to create Eve?','A rib from Adam','Dust from the ground','A piece of fruit','Water from the river','a'),
(1,'How many sons did Jacob have?','Ten','Twelve','Seven','Fourteen','b'),
(1,'What did the brothers of Joseph do to him?','They sold him into slavery','They killed him','They sent him away','They made him king','a'),
(1,'What was the name of the garden where Adam and Eve lived?','Gethsemane','Eden','Gilead','Sharon','b'),
-- Week 2: Genesis 50 - Leviticus 7
(2,'How did Joseph die?','He was killed in battle','He was taken to Egypt in a coffin','He died of old age in Canaan','He drowned in the sea','b'),
(2,'Through which body of water did God lead the Israelites on dry ground?','The Jordan River','The Red Sea','The Dead Sea','The Nile River','b'),
(2,'What did God provide as food for the Israelites in the wilderness?','Manna and quail','Bread and fish','Fruits and vegetables','Meat and water','a'),
(2,'What are the Ten Commandments also known as?','The Law of Moses','The Decalogue','The Covenant Code','Both A and B','d'),
(2,'Who was the high priest that helped Moses lead the Israelites?','Joshua','Aaron','Caleb','Eleazar','b'),
-- Week 3: Leviticus 8 - Numbers 25
(3,'What is the central theme of the book of Leviticus?','Holiness and worship','War and conquest','Love and relationships','Travel and journey','a'),
(3,'How did God lead the Israelites through the wilderness?','With a pillar of cloud by day and fire by night','With a map','With a compass','With angels','a'),
(3,'What did the Israelites do when they feared entering the Promised Land?','They rebelled and wanted to return to Egypt','They fought anyway','They prayed for help','They sent spies first','a'),
(3,'How long did the Israelites wander in the wilderness?','Forty years','Twenty years','Ten years','Seven years','a'),
(3,'What happened when the Israelites complained about food?','God sent manna','God sent a plague','God sent fire','God sent quail and a plague','d'),
-- Week 4: Numbers 26 - Joshua 1
(4,'How did Moses die?','He was killed in battle','God took him on Mount Nebo','He drowned','He died of old age in Egypt','b'),
(4,'Who succeeded Moses as leader of Israel?','Aaron','Joshua','Caleb','Samuel','b'),
(4,'What was the purpose of the cities of refuge?','To provide shelter for travelers','To protect those who killed accidentally','To serve as capitals','To store weapons','b'),
(4,'What is the book of Deuteronomy mostly about?','Recap of the law before entering the Promised Land','Stories of kings','Songs and poems','Prophecies about exile','a'),
(4,'What did God tell Joshua when he became leader?','Be strong and courageous','Build a temple','Make alliances','Count the people','a')
ON CONFLICT DO NOTHING;
