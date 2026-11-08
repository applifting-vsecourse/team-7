-- Every handler's library starts with the default disciplines (#72).
-- Existing users get them once, in Czech (the default language), unless
-- they already have a discipline of the same name. Ids are derived from the
-- user, so each goal and exercise finds the row it belongs to.

-- Základy poslušnosti
INSERT INTO "discipline" ("id", "name", "userId")
SELECT 'dd' || md5(u.id || ':obedience'), 'Základy poslušnosti', u.id FROM "user" u
WHERE NOT EXISTS (SELECT 1 FROM "discipline" d WHERE d."userId" = u.id AND lower(d."name") = lower('Základy poslušnosti'));
INSERT INTO "goal" ("id", "name", "disciplineId")
SELECT 'dg' || md5(d.id || ':0'), 'Chůze na volném vodítku', d.id FROM "discipline" d
WHERE d.id = 'dd' || md5(d."userId" || ':obedience');
INSERT INTO "exercise" ("id", "name", "position", "goalId")
SELECT 'de' || md5(g.id || ':' || e.position), e.name, e.position, g.id
FROM "goal" g JOIN "discipline" d ON d.id = g."disciplineId"
CROSS JOIN (VALUES ('Pozornost na jméno', 0), ('Chůze u nohy 10 kroků bez tahu', 1), ('Změny směru', 2)) AS e("name", "position")
WHERE d.id = 'dd' || md5(d."userId" || ':obedience') AND g.id = 'dg' || md5(d.id || ':0');
INSERT INTO "goal" ("id", "name", "disciplineId")
SELECT 'dg' || md5(d.id || ':1'), 'Sedni, lehni, zůstaň', d.id FROM "discipline" d
WHERE d.id = 'dd' || md5(d."userId" || ':obedience');
INSERT INTO "exercise" ("id", "name", "position", "goalId")
SELECT 'de' || md5(g.id || ':' || e.position), e.name, e.position, g.id
FROM "goal" g JOIN "discipline" d ON d.id = g."disciplineId"
CROSS JOIN (VALUES ('Sedni na povel', 0), ('Lehni na povel', 1), ('Zůstaň 30 s na 3 m', 2)) AS e("name", "position")
WHERE d.id = 'dd' || md5(d."userId" || ':obedience') AND g.id = 'dg' || md5(d.id || ':1');
INSERT INTO "goal" ("id", "name", "disciplineId")
SELECT 'dg' || md5(d.id || ':2'), 'Klidné setkání', d.id FROM "discipline" d
WHERE d.id = 'dd' || md5(d."userId" || ':obedience');
INSERT INTO "exercise" ("id", "name", "position", "goalId")
SELECT 'de' || md5(g.id || ':' || e.position), e.name, e.position, g.id
FROM "goal" g JOIN "discipline" d ON d.id = g."disciplineId"
CROSS JOIN (VALUES ('Pozdrav s cizím člověkem bez skákání', 0), ('Míjení psa na vodítku', 1)) AS e("name", "position")
WHERE d.id = 'dd' || md5(d."userId" || ':obedience') AND g.id = 'dg' || md5(d.id || ':2');

-- Spolehlivé přivolání
INSERT INTO "discipline" ("id", "name", "userId")
SELECT 'dd' || md5(u.id || ':recall'), 'Spolehlivé přivolání', u.id FROM "user" u
WHERE NOT EXISTS (SELECT 1 FROM "discipline" d WHERE d."userId" = u.id AND lower(d."name") = lower('Spolehlivé přivolání'));
INSERT INTO "goal" ("id", "name", "disciplineId")
SELECT 'dg' || md5(d.id || ':0'), 'Přivolání doma', d.id FROM "discipline" d
WHERE d.id = 'dd' || md5(d."userId" || ':recall');
INSERT INTO "exercise" ("id", "name", "position", "goalId")
SELECT 'de' || md5(g.id || ':' || e.position), e.name, e.position, g.id
FROM "goal" g JOIN "discipline" d ON d.id = g."disciplineId"
CROSS JOIN (VALUES ('Na jméno z vedlejší místnosti', 0), ('Z 5 m v klidu', 1)) AS e("name", "position")
WHERE d.id = 'dd' || md5(d."userId" || ':recall') AND g.id = 'dg' || md5(d.id || ':0');
INSERT INTO "goal" ("id", "name", "disciplineId")
SELECT 'dg' || md5(d.id || ':1'), 'Venku na dlouhé lince', d.id FROM "discipline" d
WHERE d.id = 'dd' || md5(d."userId" || ':recall');
INSERT INTO "exercise" ("id", "name", "position", "goalId")
SELECT 'de' || md5(g.id || ':' || e.position), e.name, e.position, g.id
FROM "goal" g JOIN "discipline" d ON d.id = g."disciplineId"
CROSS JOIN (VALUES ('10 m lanko', 0), ('S hračkou na zemi', 1)) AS e("name", "position")
WHERE d.id = 'dd' || md5(d."userId" || ':recall') AND g.id = 'dg' || md5(d.id || ':1');
INSERT INTO "goal" ("id", "name", "disciplineId")
SELECT 'dg' || md5(d.id || ':2'), 'S rozptýlením', d.id FROM "discipline" d
WHERE d.id = 'dd' || md5(d."userId" || ':recall');
INSERT INTO "exercise" ("id", "name", "position", "goalId")
SELECT 'de' || md5(g.id || ':' || e.position), e.name, e.position, g.id
FROM "goal" g JOIN "discipline" d ON d.id = g."disciplineId"
CROSS JOIN (VALUES ('Od jiného psa', 0), ('Od hry', 1)) AS e("name", "position")
WHERE d.id = 'dd' || md5(d."userId" || ':recall') AND g.id = 'dg' || md5(d.id || ':2');

-- Nosework – začátky
INSERT INTO "discipline" ("id", "name", "userId")
SELECT 'dd' || md5(u.id || ':nosework'), 'Nosework – začátky', u.id FROM "user" u
WHERE NOT EXISTS (SELECT 1 FROM "discipline" d WHERE d."userId" = u.id AND lower(d."name") = lower('Nosework – začátky'));
INSERT INTO "goal" ("id", "name", "disciplineId")
SELECT 'dg' || md5(d.id || ':0'), 'Hra s krabicemi', d.id FROM "discipline" d
WHERE d.id = 'dd' || md5(d."userId" || ':nosework');
INSERT INTO "exercise" ("id", "name", "position", "goalId")
SELECT 'de' || md5(g.id || ':' || e.position), e.name, e.position, g.id
FROM "goal" g JOIN "discipline" d ON d.id = g."disciplineId"
CROSS JOIN (VALUES ('Pamlsek v 1 z 5 krabic', 0), ('Hledání ve 10 krabicích', 1)) AS e("name", "position")
WHERE d.id = 'dd' || md5(d."userId" || ':nosework') AND g.id = 'dg' || md5(d.id || ':0');
INSERT INTO "goal" ("id", "name", "disciplineId")
SELECT 'dg' || md5(d.id || ':1'), 'Zavedení pachu', d.id FROM "discipline" d
WHERE d.id = 'dd' || md5(d."userId" || ':nosework');
INSERT INTO "exercise" ("id", "name", "position", "goalId")
SELECT 'de' || md5(g.id || ':' || e.position), e.name, e.position, g.id
FROM "goal" g JOIN "discipline" d ON d.id = g."disciplineId"
CROSS JOIN (VALUES ('Pach + pamlsek v krabici', 0), ('Pach v 1 z 5 krabic', 1)) AS e("name", "position")
WHERE d.id = 'dd' || md5(d."userId" || ':nosework') AND g.id = 'dg' || md5(d.id || ':1');
INSERT INTO "goal" ("id", "name", "disciplineId")
SELECT 'dg' || md5(d.id || ':2'), 'Hledání v místnosti', d.id FROM "discipline" d
WHERE d.id = 'dd' || md5(d."userId" || ':nosework');
INSERT INTO "exercise" ("id", "name", "position", "goalId")
SELECT 'de' || md5(g.id || ':' || e.position), e.name, e.position, g.id
FROM "goal" g JOIN "discipline" d ON d.id = g."disciplineId"
CROSS JOIN (VALUES ('Pach v místnosti', 0), ('Pach ve výšce', 1)) AS e("name", "position")
WHERE d.id = 'dd' || md5(d."userId" || ':nosework') AND g.id = 'dg' || md5(d.id || ':2');

-- Agility – základy
INSERT INTO "discipline" ("id", "name", "userId")
SELECT 'dd' || md5(u.id || ':agility'), 'Agility – základy', u.id FROM "user" u
WHERE NOT EXISTS (SELECT 1 FROM "discipline" d WHERE d."userId" = u.id AND lower(d."name") = lower('Agility – základy'));
INSERT INTO "goal" ("id", "name", "disciplineId")
SELECT 'dg' || md5(d.id || ':0'), 'Ovládání těla', d.id FROM "discipline" d
WHERE d.id = 'dd' || md5(d."userId" || ':agility');
INSERT INTO "exercise" ("id", "name", "position", "goalId")
SELECT 'de' || md5(g.id || ':' || e.position), e.name, e.position, g.id
FROM "goal" g JOIN "discipline" d ON d.id = g."disciplineId"
CROSS JOIN (VALUES ('Start se zůstaň', 0), ('Target 2on2off na zemi', 1)) AS e("name", "position")
WHERE d.id = 'dd' || md5(d."userId" || ':agility') AND g.id = 'dg' || md5(d.id || ':0');
INSERT INTO "goal" ("id", "name", "disciplineId")
SELECT 'dg' || md5(d.id || ':1'), 'Tunel a nízké skoky', d.id FROM "discipline" d
WHERE d.id = 'dd' || md5(d."userId" || ':agility');
INSERT INTO "exercise" ("id", "name", "position", "goalId")
SELECT 'de' || md5(g.id || ':' || e.position), e.name, e.position, g.id
FROM "goal" g JOIN "discipline" d ON d.id = g."disciplineId"
CROSS JOIN (VALUES ('Rovný tunel', 0), ('Skok v úrovni hlezna', 1), ('Tunel + skok', 2)) AS e("name", "position")
WHERE d.id = 'dd' || md5(d."userId" || ':agility') AND g.id = 'dg' || md5(d.id || ':1');
INSERT INTO "goal" ("id", "name", "disciplineId")
SELECT 'dg' || md5(d.id || ':2'), 'Slalom', d.id FROM "discipline" d
WHERE d.id = 'dd' || md5(d."userId" || ':agility');
INSERT INTO "exercise" ("id", "name", "position", "goalId")
SELECT 'de' || md5(g.id || ':' || e.position), e.name, e.position, g.id
FROM "goal" g JOIN "discipline" d ON d.id = g."disciplineId"
CROSS JOIN (VALUES ('Kanálová metoda 2 tyče', 0), ('6 tyčí rozestoupených', 1)) AS e("name", "position")
WHERE d.id = 'dd' || md5(d."userId" || ':agility') AND g.id = 'dg' || md5(d.id || ':2');

-- Canicross – začátky
INSERT INTO "discipline" ("id", "name", "userId")
SELECT 'dd' || md5(u.id || ':canicross'), 'Canicross – začátky', u.id FROM "user" u
WHERE NOT EXISTS (SELECT 1 FROM "discipline" d WHERE d."userId" = u.id AND lower(d."name") = lower('Canicross – začátky'));
INSERT INTO "goal" ("id", "name", "disciplineId")
SELECT 'dg' || md5(d.id || ':0'), 'Povely', d.id FROM "discipline" d
WHERE d.id = 'dd' || md5(d."userId" || ':canicross');
INSERT INTO "exercise" ("id", "name", "position", "goalId")
SELECT 'de' || md5(g.id || ':' || e.position), e.name, e.position, g.id
FROM "goal" g JOIN "discipline" d ON d.id = g."disciplineId"
CROSS JOIN (VALUES ('Vpřed', 0), ('Pomalu', 1), ('Stůj', 2), ('Vpravo', 3), ('Vlevo', 4)) AS e("name", "position")
WHERE d.id = 'dd' || md5(d."userId" || ':canicross') AND g.id = 'dg' || md5(d.id || ':0');
INSERT INTO "goal" ("id", "name", "disciplineId")
SELECT 'dg' || md5(d.id || ':1'), 'Tah v postroji', d.id FROM "discipline" d
WHERE d.id = 'dd' || md5(d."userId" || ':canicross');
INSERT INTO "exercise" ("id", "name", "position", "goalId")
SELECT 'de' || md5(g.id || ':' || e.position), e.name, e.position, g.id
FROM "goal" g JOIN "discipline" d ON d.id = g."disciplineId"
CROSS JOIN (VALUES ('Tah v chůzi 5 min', 0)) AS e("name", "position")
WHERE d.id = 'dd' || md5(d."userId" || ':canicross') AND g.id = 'dg' || md5(d.id || ':1');
INSERT INTO "goal" ("id", "name", "disciplineId")
SELECT 'dg' || md5(d.id || ':2'), 'Kondice', d.id FROM "discipline" d
WHERE d.id = 'dd' || md5(d."userId" || ':canicross');
INSERT INTO "exercise" ("id", "name", "position", "goalId")
SELECT 'de' || md5(g.id || ':' || e.position), e.name, e.position, g.id
FROM "goal" g JOIN "discipline" d ON d.id = g."disciplineId"
CROSS JOIN (VALUES ('Běh 1 min / chůze 2 min × 6', 0)) AS e("name", "position")
WHERE d.id = 'dd' || md5(d."userId" || ':canicross') AND g.id = 'dg' || md5(d.id || ':2');
