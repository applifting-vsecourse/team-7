-- Copies of catalog disciplines without a description get the catalog's
-- one-sentence one (#14): the former default disciplines (#72) were created
-- with a name only. English when the copy carries the English name, else
-- Czech; descriptions the handler wrote stay as they are.
UPDATE "discipline" d
SET "description" = CASE
  WHEN lower(d."name") = lower(texts.en_name) THEN texts.en
  ELSE texts.cs
END
FROM (VALUES
    ('agility', 'Agility – basics', 'Pes probíhá parkur ze skoků, tunelů a slalomu a psovod ho vede tělem a povely.', 'The dog runs a course of jumps, tunnels and weaves, guided by your body and cues.'),
    ('hoopers', 'Hoopers – distance handling', 'Pes probíhá trať z obručí, barelů a tunelů a psovod ho vede z jednoho místa hlasem a tělem.', 'The dog runs hoops, barrels and tunnels while you guide them from one spot by voice and body.'),
    ('disc-dog', 'Disc dog – toss and fetch', 'Psovod hází disk, pes ho chytá a přináší zpět.', 'You throw a disc, and your dog catches it and brings it back.'),
    ('obedience', 'Obedience basics', 'Slušné chování na vodítku i mezi lidmi a základní povely sedni, lehni a zůstaň.', 'Good manners on lead and around people, plus sit, down and stay.'),
    ('recall', 'Reliable recall', 'Přivolání, na které se dá spolehnout na procházce i u jiných psů.', 'A recall you can rely on, on walks and around other dogs.'),
    ('puppy', 'Puppy & socialisation', 'Bezpečné seznamování štěněte se světem a první domácí návyky.', 'Safely introducing a puppy to the world, plus first house manners.'),
    ('calm', 'Calm at home & alone time', 'Pes, který umí doma odpočívat a zvládne chvíle bez vás.', 'A dog who can settle at home and cope with time on their own.'),
    ('tricks', 'Tricks', 'Triky pro radost, procvičení hlavy a lepší spolupráci.', 'Tricks for fun, mental exercise and better teamwork.'),
    ('canicross', 'Canicross – first steps', 'Běh se psem, který vás v tažném postroji táhne na šňůře s amortizérem.', 'Running with your dog pulling you in a harness on a bungee line.'),
    ('bikejoring', 'Bikejoring – first steps', 'Pes v tažném postroji běží před horským kolem.', 'Your dog runs in a pulling harness in front of a mountain bike.'),
    ('dogtrekking', 'Dogtrekking – long-distance hiking', 'Dálkový pochod se psem podle mapy přes kontroly.', 'Long-distance hiking with your dog, navigating by map between checkpoints.'),
    ('competitive-obedience', 'Obedience – beginner class', 'Sportovní poslušnost pro začátečnickou třídu: chůze u nohy, odložení, přivolání a další cviky.', 'Competitive obedience for the beginner class: heelwork, stays, recall and more.'),
    ('rally-obedience', 'Rally obedience – beginners', 'Tým prochází parkur s kartami a na každé provede předepsaný cvik.', 'You and your dog work through a course of signs, performing the exercise on each.'),
    ('dogdancing', 'Dog dancing – heelwork and freestyle', 'Sestava na hudbu z prvků u nohy a volných triků.', 'A routine to music made of heelwork moves and free tricks.'),
    ('nosework', 'Nosework – first steps', 'Pes hledá ukrytý pachový vzorek v krabicích, v místnosti i venku.', 'Your dog searches for a hidden scent in boxes, rooms and outdoors.'),
    ('tracking', 'Tracking – foundations', 'Pes jde s nízkým nosem po stopě člověka a označuje předměty na ní.', 'Your dog follows a person''s track nose down and indicates the articles on it.'),
    ('mantrailing', 'Mantrailing – first steps', 'Pes na dlouhém vodítku hledá konkrétního člověka podle jeho pachu.', 'On a long line, your dog finds one particular person by their scent.')
) AS texts(key, en_name, cs, en)
WHERE d."catalogKey" = texts.key
  AND (d."description" IS NULL OR btrim(d."description") = '');
