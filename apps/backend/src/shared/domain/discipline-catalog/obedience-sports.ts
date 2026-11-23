// Generated from the F-63 content (obedience-sports.json) by to-ts.mjs; edit the JSON and regenerate.
// Sources:
// - https://zkovm.websnadno.cz/zkusebni-rad-aktualizace-unor2014.pdf
// - https://www.obedience.cz/userFiles/2026nzr-ro-cz-final.pdf
// - https://fci.be/medias/FCI-ROB-REG-2025-en-19918.pdf
// - https://www.fci.be/medias/DDA-REG-49-2020-en-19912.pdf
// - https://www.dogdancingclubcr.com/_files/ugd/006ff6_04058ac899fe4326a9126604302e734f.pdf
// - https://fci.be/EN/Dog-Dancing-1352.html
import type { CatalogCategory } from "./types";

export const obedienceSports: CatalogCategory = {
  key: "obedience-sports",
  name: {
    cs: "Poslušnost a ovladatelnost",
    en: "Obedience sports",
  },
  description: {
    cs: "Sporty, ve kterých pes a psovod předvádějí přesnou souhru: obedience, rally obedience a dogdancing. Cviky vycházejí ze začátečnických tříd českých zkušebních řádů a hodí se i pro psy, kteří na závody nikdy nepojedou.",
    en: "Sports built on precise teamwork between dog and handler: obedience, rally obedience and dog dancing. The exercises follow the beginner classes of the Czech rulebooks and work just as well for dogs that will never compete.",
  },
  disciplines: [
    {
      key: "competitive-obedience",
      shortName: {
        cs: "Obedience",
        en: "Obedience",
      },
      name: {
        cs: "Obedience – začátečnická třída",
        en: "Obedience – beginner class",
      },
      description: {
        cs: "Sportovní poslušnost podle třídy OB-Z: odložení ve skupině, chůze u nohy, odložení za chůze, přivolání, vyslání do čtverce, držení činky, ovladatelnost na dálku a skok. Hodí se pro psy, kteří už znají sedni, lehni a přivolání. Na zkoušku musí mít pes aspoň 10 měsíců. Skok trénujte nízko (v OB-Z nejvýš 50 cm) a u mladého psa ho zvyšujte až po ukončení růstu a prohlídce u veterináře.",
        en: "Competitive obedience based on the Czech beginner class (OB-Z): group stay, heelwork, positions on the move, recall, send-away to a square, dumbbell hold, distance control and a jump. Suits dogs that already know sit, down and recall. Dogs must be at least 10 months old to enter. Keep the jump low (50 cm max in this class) and raise it for a young dog only once they have finished growing and a vet has checked them.",
      },
      goals: [
        {
          name: {
            cs: "Základní pozice a odložení",
            en: "Heel position and stays",
          },
          criterion: {
            cs: "Pes zvládne každý cvik v 8 z 10 pokusů ve 3 trénincích po sobě, alespoň jednou na cizím cvičišti nebo vedle jiných psů.",
            en: "The dog succeeds at each exercise in 8 of 10 attempts in 3 sessions in a row, at least once at an unfamiliar training ground or next to other dogs.",
          },
          exercises: [
            {
              name: {
                cs: "Zaujetí základní pozice u nohy",
                en: "Find the heel position",
              },
              procedure: {
                cs: "1. Stůjte rovně, pamlsek držte u levého boku a naveďte psa, aby si sedl u levé nohy, ramenem u vašeho kolena. 2. Za správnou pozici hned odměňte a návnadu postupně nahraďte povelem „K noze“. 3. Udělejte krok či dva vpřed, zastavte se a nechte psa, ať pozici najde znovu. 4. Úspěšný pokus: pes na jeden povel sedí rovně a těsně u levé nohy a nepředbíhá.",
                en: "1. Stand straight, hold a treat at your left hip and lure the dog into a sit by your left leg, shoulder level with your knee. 2. Reward the correct position at once and gradually replace the lure with the cue “Heel”. 3. Take a step or two, halt and let the dog find the position again. 4. Successful attempt: on one cue the dog sits straight and close at your left leg, without forging ahead.",
              },
            },
            {
              name: {
                cs: "Odložení vleže 1 min, psovod na 5 m",
                en: "Down stay 1 min, handler at 5 m",
              },
              procedure: {
                cs: "1. Ze základní pozice dejte povel „Lehni“ a „Zůstaň“. 2. Odejděte 5 m, otočte se čelem ke psovi a stůjte 1 minutu; začněte několika sekundami a dobu prodlužujte. 3. Vraťte se ke psovi na jeho pravou stranu a teprve pak odměňte. 4. Úspěšný pokus: pes leží celou minutu a nehne se z místa, dokud nejste zpět u něj.",
                en: "1. From heel position cue “Down” and “Stay”. 2. Walk 5 m away, turn to face the dog and stand for 1 minute; start with a few seconds and build up. 3. Return to the dog's right side and only then reward. 4. Successful attempt: the dog stays down for the full minute without moving until you are back beside them.",
              },
            },
            {
              name: {
                cs: "Odložení vleže ve skupině 1 min, 20 m",
                en: "Group down stay 1 min at 20 m",
              },
              procedure: {
                cs: "1. Odložte psa vleže v řadě s dalšími psy asi 3 m od sebe. 2. Odejděte bez ohlížení 20 m, otočte se a stůjte 1 minutu. 3. Vraťte se ke psovi, dejte povel „Sedni“ a teprve pak odměňte. 4. Úspěšný pokus: pes celou dobu leží, nevstane, nesedne si, nepopolézá a neštěká.",
                en: "1. Put the dog in a down in a line with other dogs about 3 m apart. 2. Walk 20 m away without looking back, turn round and stand for 1 minute. 3. Return to the dog, cue “Sit”, then reward. 4. Successful attempt: the dog stays down the whole time, without standing, sitting, creeping or barking.",
              },
            },
            {
              name: {
                cs: "Ovladatelnost na dálku – 4 změny polohy",
                en: "Distance control – 4 position changes",
              },
              procedure: {
                cs: "1. Naučte psa sedni z lehu a lehni ze sedu tak, aby nepostupoval dopředu; pomůže podložka nebo nízký stupínek, jehož hranu má pes za sebou. 2. Stůjte těsně před psem a dejte povely sedni–lehni–sedni–lehni, mezi nimi asi 5 s. 3. Odstup postupně zvětšujte a psa odměňujte na místě. 4. Úspěšný pokus: pes provede všechny 4 změny, každou na jeden povel, a posune se o méně než délku těla.",
                en: "1. Teach sit-from-down and down-from-sit without the dog stepping forward; a mat or low platform with its edge behind the dog helps. 2. Stand right in front of the dog and cue sit–down–sit–down, about 5 s apart. 3. Gradually add distance and reward the dog in place. 4. Successful attempt: the dog does all 4 changes, each on a single cue, and moves less than one body length.",
              },
            },
          ],
        },
        {
          name: {
            cs: "Chůze u nohy a odložení za chůze",
            en: "Heelwork and positions on the move",
          },
          criterion: {
            cs: "Pes zvládne každý cvik bez vodítka v 8 z 10 pokusů ve 3 trénincích po sobě, alespoň jednou s rušením (jiný pes, lidé).",
            en: "The dog succeeds at each exercise off lead in 8 of 10 attempts in 3 sessions in a row, at least once with distractions (another dog, people).",
          },
          exercises: [
            {
              name: {
                cs: "Chůze u nohy 15 kroků se zastavením",
                en: "Heel 15 steps with a halt",
              },
              procedure: {
                cs: "1. Ze základní pozice dejte povel „K noze“ a vykročte normálním tempem. 2. Zpočátku odměňujte u levé nohy každých pár kroků, interval postupně prodlužujte. 3. Po 15 krocích se zastavte bez povelu; pes si má sednout sám. 4. Úspěšný pokus: pes jde celou dobu rovnoběžně u levé nohy do půl metru od ní a při zastavení si sám sedne.",
                en: "1. From heel position cue “Heel” and step off at normal pace. 2. At first reward at your left leg every few steps, then gradually stretch the interval. 3. After 15 steps halt without a cue; the dog should sit on their own. 4. Successful attempt: the dog stays parallel at your left leg, within half a metre, the whole way and sits automatically at the halt.",
              },
            },
            {
              name: {
                cs: "Kruh doleva kolem kužele a přímka",
                en: "Left circle around a cone and straight",
              },
              procedure: {
                cs: "1. Postavte kužel a obejděte ho se psem u nohy po kruhu doleva (poloměr asi 4 m). 2. Na výchozím bodě pokračujte bez změny tempa rovně asi 15 kroků a zastavte se. 3. Pes je na vnitřní straně kruhu: zkraťte krok a odměňujte, aby do vás nevrážel ani nezaostával. 4. Úspěšný pokus: pes udrží pozici u nohy po celém kruhu i přímce a na konci si sedne.",
                en: "1. Set up a cone and heel around it in a left-hand circle (about 4 m radius). 2. Back at the start, carry on straight for about 15 steps without changing pace and halt. 3. The dog is on the inside of the circle: shorten your stride and reward so they neither bump into you nor lag. 4. Successful attempt: the dog holds heel position through the circle and the straight and sits at the end.",
              },
            },
            {
              name: {
                cs: "Odložení do sedu za chůze",
                en: "Sit while heeling",
              },
              procedure: {
                cs: "1. Jděte se psem u nohy a bez zpomalení dejte povel „Sedni“. 2. Zpočátku se zastavte s ním, později pokračujte 1–3 kroky a otočte se ke psovi čelem. 3. Vraťte se ke psovi a odměňte ho v sedu. 4. Úspěšný pokus: pes si sedne hned na první povel bez pomoci rukou a sedí, dokud se k němu nevrátíte.",
                en: "1. Heel with the dog and, without slowing down, cue “Sit”. 2. At first stop with them; later keep walking 1–3 steps and turn to face the dog. 3. Go back to the dog and reward them in the sit. 4. Successful attempt: the dog sits immediately on the first cue with no hand signal and stays sitting until you are back.",
              },
            },
            {
              name: {
                cs: "Odložení do lehu za chůze",
                en: "Down while heeling",
              },
              procedure: {
                cs: "1. Postavte dva kužely 10 m od sebe a jděte mezi nimi se psem u nohy. 2. V polovině dejte povel „Lehni“, pokračujte k druhému kuželi, obejděte ho a vraťte se ke psovi zezadu. 3. Jakmile je pes u vaší levé nohy, dejte „K noze“ a dojděte spolu k druhému kuželi; odměňte. 4. Úspěšný pokus: pes si lehne do délky těla od místa povelu a leží, dokud ho nevezmete k noze.",
                en: "1. Set two cones 10 m apart and heel between them. 2. Halfway, cue “Down”, keep walking to the second cone, go round it and come back to the dog from behind. 3. Once the dog is at your left leg, cue “Heel” and walk together to the second cone; reward. 4. Successful attempt: the dog drops within one body length of the cue and stays down until you pick them up at heel.",
              },
            },
          ],
        },
        {
          name: {
            cs: "Přivolání, činka, skok a čtverec",
            en: "Recall, dumbbell, jump and square",
          },
          criterion: {
            cs: "Pes zvládne každý cvik v 8 z 10 pokusů ve 3 trénincích po sobě; přivolání a čtverec v plné vzdálenosti podle OB-Z (20 m, 5 m).",
            en: "The dog succeeds at each exercise in 8 of 10 attempts in 3 sessions in a row; recall and square at the full beginner-class distance (20 m, 5 m).",
          },
          exercises: [
            {
              name: {
                cs: "Držení aportovací činky 10 s",
                en: "Hold the dumbbell for 10 s",
              },
              procedure: {
                cs: "1. Pes sedí; nabídněte mu dřevěnou činku před tlamou a odměňte každé dobrovolné uchopení. 2. Postupně odměňujte až klidné držení bez žvýkání, nejdřív 2 s, pak 5 a 10 s. 3. Přidejte povely „Drž“ a „Pusť“ a činku vyměňte za pamlsek. 4. Úspěšný pokus: pes vezme činku na první povel, drží ji vsedě 10 s bez převalování v tlamě a pustí ji až na povel.",
                en: "1. With the dog sitting, offer the wooden dumbbell in front of their mouth and reward every voluntary grab. 2. Gradually reward only a calm hold without chewing: 2 s first, then 5 and 10 s. 3. Add the cues “Hold” and “Give” and swap the dumbbell for a treat. 4. Successful attempt: the dog takes the dumbbell on the first cue, holds it in a sit for 10 s without mouthing and releases it only on cue.",
              },
            },
            {
              name: {
                cs: "Přivolání z lehu na 20 m",
                en: "Recall from a down at 20 m",
              },
              procedure: {
                cs: "1. Odložte psa vleže, dejte „Čekej“ a odejděte rovně; začněte na 5 m a vzdálenost zvyšujte. 2. Otočte se, chvíli počkejte a zavolejte „Ke mně“. 3. Pes přibíhá do sedu před vás nebo k noze; odměňte ho až tam, občas hozenou hračkou. 4. Úspěšný pokus: pes čeká na povel a na jedno zavolání přiběhne aspoň klusem přímo k vám.",
                en: "1. Put the dog in a down, cue “Wait” and walk straight away; start at 5 m and build up. 2. Turn round, pause and call “Come”. 3. The dog finishes in a sit in front of you or at heel; reward there, sometimes with a thrown toy. 4. Successful attempt: the dog waits for the cue and, on a single call, comes straight to you at least at a trot.",
              },
            },
            {
              name: {
                cs: "Skok přes překážku",
                en: "Jump over a hurdle",
              },
              procedure: {
                cs: "1. Začněte s laťkou na zemi nebo velmi nízko a výšku zvyšujte podle kohoutkové výšky psa (v OB-Z nejvýš 50 cm). 2. Posaďte psa 2–4 m před překážku, obejděte ji a postavte se 2–4 m za ni. 3. Zavolejte „Hop“ nebo „Ke mně“ a odměňte za překážkou. 4. Úspěšný pokus: pes čeká na povel a nejkratší cestou k vám překážku přeskočí, aniž by se jí dotkl.",
                en: "1. Start with the bar on the ground or very low and raise it in line with the dog's height at the withers (50 cm max in the beginner class). 2. Sit the dog 2–4 m in front of the hurdle, walk round it and stand 2–4 m beyond it. 3. Call “Over” or “Come” and reward on your side. 4. Successful attempt: the dog waits for the cue and clears the hurdle without touching it, taking the shortest way to you.",
              },
            },
            {
              name: {
                cs: "Vyslání do čtverce na 5 m",
                en: "Send-away to a square at 5 m",
              },
              procedure: {
                cs: "1. Vyznačte čtverec 3 × 3 m kužely a páskou a doprostřed položte misku s pamlskem nebo podložku. 2. Začněte na 1–2 m: vyšlete psa povelem „Box“ a ve čtverci dejte „Lehni“. 3. Vzdálenost zvyšujte na 5 m a misku postupně odstraňte; odměnu doneste nebo hoďte do čtverce. 4. Úspěšný pokus: pes jde přímo do čtverce, lehne si na jeden povel a celým tělem je uvnitř.",
                en: "1. Mark a 3 × 3 m square with cones and tape and put a treat bowl or mat in the middle. 2. Start at 1–2 m: send the dog with “Box” and cue “Down” once they are inside. 3. Build up to 5 m and fade the bowl; bring or throw the reward into the square. 4. Successful attempt: the dog goes straight into the square, drops on one cue and is completely inside.",
              },
            },
          ],
        },
      ],
    },
    {
      key: "rally-obedience",
      shortName: {
        cs: "Rally",
        en: "Rally",
      },
      name: {
        cs: "Rally obedience – začátečníci",
        en: "Rally obedience – beginners",
      },
      description: {
        cs: "Tým prochází parkur s kartami (u začátečníků 15–18 karet) a na každé provede předepsaný cvik: zastavení, polohy, obraty, změny tempa, předsednutí, slalom či spirálu. Pochvala a mluvení na psa jsou vítané a v začátečnické třídě může pes jít na volném vodítku. Hodí se pro každého psa od 10 měsíců, i pro starší a méně sportovní psy.",
        en: "The team works through a course of signs (15–18 at beginner level) and performs the exercise shown on each: halts, positions, turns, pace changes, fronts, slalom or spiral. Praise and talking to the dog are encouraged, and in the beginner class the dog may work on a loose lead. Suits any dog from 10 months, including older and less athletic dogs.",
      },
      goals: [
        {
          name: {
            cs: "Zastavení a polohy u nohy",
            en: "Halts and positions at heel",
          },
          criterion: {
            cs: "Pes zvládne každý cvik na volném vodítku i bez něj v 8 z 10 pokusů ve 3 trénincích po sobě.",
            en: "The dog succeeds at each exercise, both on a loose lead and off lead, in 8 of 10 attempts in 3 sessions in a row.",
          },
          exercises: [
            {
              name: {
                cs: "Stop – sedni u nohy",
                en: "Halt – sit at heel",
              },
              procedure: {
                cs: "1. Jděte se psem u nohy a zastavte se u karty (zpočátku stačí kužel). 2. Pes si sedne sám nebo na povel „Sedni“ těsně u nohy. 3. Krátce počkejte, odměňte ho v sedu a pokračujte. 4. Úspěšný pokus: pes si sedne rovně u nohy nejvýš na jeden povel a vodítko zůstane prověšené.",
                en: "1. Heel with the dog and halt at the sign (a cone is fine at first). 2. The dog sits by themselves or on “Sit”, close at your leg. 3. Pause, reward in the sit and move on. 4. Successful attempt: the dog sits straight at heel on no more than one cue and the lead stays slack.",
              },
            },
            {
              name: {
                cs: "Stop – lehni",
                en: "Halt – down",
              },
              procedure: {
                cs: "1. Zastavte se a nechte psa sednout u nohy. 2. Dejte povel „Lehni“; zůstaňte stát vzpřímeně a případný posunek ať je jen krátký. 3. Odměňte vleže a vykročte. 4. Úspěšný pokus: pes si lehne vedle vás na jeden povel, nepopolézá dopředu a leží, dokud nevykročíte.",
                en: "1. Halt and let the dog sit at heel. 2. Cue “Down”; stay upright and keep any hand signal brief. 3. Reward in the down and move off. 4. Successful attempt: the dog lies down beside you on one cue, without creeping forward, and stays down until you move off.",
              },
            },
            {
              name: {
                cs: "Stop – lehni – sedni",
                en: "Halt – down – sit",
              },
              procedure: {
                cs: "1. Zastavte se, pes sedí u nohy. 2. Dejte „Lehni“, vteřinu počkejte a dejte „Sedni“. 3. Zpočátku odměňujte po každé poloze, později až na konci. 4. Úspěšný pokus: pes provede obě změny polohy, každou na jeden povel, a zůstane přitom vedle vás.",
                en: "1. Halt with the dog sitting at heel. 2. Cue “Down”, wait a second, then cue “Sit”. 3. At first reward after each position, later only at the end. 4. Successful attempt: the dog does both changes, each on a single cue, and stays beside you throughout.",
              },
            },
            {
              name: {
                cs: "Stop – obejití psa",
                en: "Halt – walk around the dog",
              },
              procedure: {
                cs: "1. Zastavte se a nechte psa sednout u nohy. 2. Dejte „Zůstaň“ a obejděte ho zepředu dokola zpět do základní pozice; začněte jen krokem před psa. 3. Postavte se vedle něj, chvilku počkejte a odměňte. 4. Úspěšný pokus: pes celou dobu sedí, nemění polohu a neotáčí se za vámi.",
                en: "1. Halt and let the dog sit at heel. 2. Cue “Stay” and walk around them, starting in front, back to heel position; begin with just one step in front. 3. Stand beside the dog, pause and reward. 4. Successful attempt: the dog stays sitting the whole time without changing position or swinging round after you.",
              },
            },
          ],
        },
        {
          name: {
            cs: "Obraty a změny tempa",
            en: "Turns and pace changes",
          },
          criterion: {
            cs: "Pes zvládne každý cvik v 8 z 10 pokusů ve 3 trénincích po sobě a po celou dobu cviku je do půl metru od vaší nohy.",
            en: "The dog succeeds at each exercise in 8 of 10 attempts in 3 sessions in a row, staying within half a metre of your leg throughout.",
          },
          exercises: [
            {
              name: {
                cs: "Obrat vpravo a vlevo o 90°",
                en: "90° turn right and left",
              },
              procedure: {
                cs: "1. Jděte se psem u nohy a u karty zahněte o 90° doprava, u jiné doleva. 2. U obratu vlevo zkraťte krok a ruku s pamlskem držte u nosu psa, aby stočil zadek; u obratu vpravo psa povzbuďte, ať zrychlí. 3. Odměňte hned po obratu. 4. Úspěšný pokus: pes udrží pozici u nohy během obratu bez zastavení a bez napnutí vodítka.",
                en: "1. Heel with the dog and turn 90° right at one sign, then left at another. 2. On left turns shorten your stride and keep the treat hand at the dog's nose so they tuck their rear; on right turns encourage them to speed up. 3. Reward right after the turn. 4. Successful attempt: the dog keeps heel position through the turn without stopping and without the lead going tight.",
              },
            },
            {
              name: {
                cs: "Obrat čelem vzad (180°)",
                en: "About turn (180°)",
              },
              procedure: {
                cs: "1. U karty se se psem otočte o 180° doprava nebo doleva v malém oblouku. 2. Bez zastavení pokračujte opačným směrem. 3. Nacvičte oba směry a odměňujte hned po dokončení obratu. 4. Úspěšný pokus: pes obrat plynule dokončí u nohy a jde dál vedle vás, nepředbíhá ani nezaostává.",
                en: "1. At the sign, turn 180° right or left together in a tight arc. 2. Continue in the opposite direction without stopping. 3. Practise both directions and reward as the turn is completed. 4. Successful attempt: the dog completes the turn smoothly at heel and carries on beside you without forging or lagging.",
              },
            },
            {
              name: {
                cs: "Otočení o 270° a 360° na místě",
                en: "270° and 360° turn on the spot",
              },
              procedure: {
                cs: "1. U karty se otočte na místě o 270° (nový směr svírá s původním 90°) nebo o 360°. 2. Otáčejte se jen drobnými přešlapy; pes obchází po vnějším kruhu, nebo na vnitřní straně stáčí zadek. 3. Začněte s menšími úhly a odměňujte na konci. 4. Úspěšný pokus: pes zůstane po celou otočku u nohy a bez zastavení pokračuje s vámi.",
                en: "1. At the sign, turn on the spot through 270° (the new direction is 90° from the original) or 360°. 2. Use only small foot shuffles; the dog walks the outer circle or tucks their rear on the inside. 3. Start with smaller angles and reward at the end. 4. Successful attempt: the dog stays at heel through the whole turn and moves on with you without stopping.",
              },
            },
            {
              name: {
                cs: "Změna tempa: pomalu – rychle – normálně",
                en: "Pace change: slow – fast – normal",
              },
              procedure: {
                cs: "1. Jděte normální chůzí a u první karty výrazně zpomalte. 2. U další karty přejděte do rychlého tempa (klus), u třetí zpět do normální chůze. 3. Tempo měňte přesně u karty a držte ho až k další; odměňujte za udržení pozice. 4. Úspěšný pokus: pes se přizpůsobí každé změně tempa a zůstane u nohy bez napnutí vodítka.",
                en: "1. Walk at normal pace and slow down clearly at the first sign. 2. Speed up to a fast pace (jog) at the next sign, and back to normal at the third. 3. Change pace right at the sign and keep it until the next one; reward for holding position. 4. Successful attempt: the dog matches every pace change and stays at heel without the lead tightening.",
              },
            },
          ],
        },
        {
          name: {
            cs: "Předsednutí, slalom a krátký parkur",
            en: "Front, slalom and a short course",
          },
          criterion: {
            cs: "Pes zvládne předsednutí, slalom a spirálu v 8 z 10 pokusů a parkur z 10 karet bez vynechané či opakované karty ve 4 z 5 pokusů, obojí ve 2 trénincích po sobě.",
            en: "The dog succeeds at the front, slalom and spiral in 8 of 10 attempts and at a 10-sign course with no missed or repeated sign in 4 of 5 attempts, both in 2 sessions in a row.",
          },
          exercises: [
            {
              name: {
                cs: "Předsednutí a přiřazení k noze",
                en: "Front and finish to heel",
              },
              procedure: {
                cs: "1. Zastavte se a přivolejte psa do sedu přímo před sebe; můžete couvnout i o několik kroků, ale ne ustoupit do strany. 2. Odměňte ho v sedu u svých nohou, pamlsek držte ve středu těla. 3. Pak ho pošlete kolem sebe zprava za zády, nebo přímo k levé noze, a nechte ho sednout. 4. Úspěšný pokus: pes sedí rovně před vámi a pak se přiřadí k noze, aniž byste se pohnuli z místa.",
                en: "1. Halt and call the dog into a sit straight in front of you; you may back up a few steps, but don't sidestep. 2. Reward the sit at your feet, holding the treat at your midline. 3. Then send the dog round behind you from the right, or straight to your left leg, and have them sit. 4. Successful attempt: the dog sits straight in front of you, then finishes to heel without you moving your feet.",
              },
            },
            {
              name: {
                cs: "Slalom mezi 4 kužely",
                en: "Slalom through 4 cones",
              },
              procedure: {
                cs: "1. Postavte 4 kužely do řady 1,5 m od sebe. 2. Vstupte se psem u nohy tak, aby byl první kužel vlevo, a projděte slalomem. 3. Na vnitřních obloucích zkracujte krok; odměňte na konci. 4. Úspěšný pokus: tým projde všemi mezerami správně, pes zůstává u nohy a žádný kužel neshodí.",
                en: "1. Set 4 cones in a line 1.5 m apart. 2. Enter with the dog at heel so the first cone is on your left, and weave through. 3. Shorten your stride on the inside curves; reward at the end. 4. Successful attempt: the team passes every gap correctly, the dog stays at heel and no cone is knocked over.",
              },
            },
            {
              name: {
                cs: "Spirála kolem 3 kuželů",
                en: "Spiral around 3 cones",
              },
              procedure: {
                cs: "1. Postavte 3 kužely do řady 1,5 m od sebe. 2. Obejděte se psem u nohy všechny tři kužely, pak první dva a nakonec jen první. 3. Cvičte spirálu doprava i doleva; když je pes uvnitř, zpomalte a odměňujte u jeho nosu. 4. Úspěšný pokus: tým obejde kužely ve správném pořadí a pes celou dobu drží pozici u nohy.",
                en: "1. Set 3 cones in a line 1.5 m apart. 2. Heel around all three cones, then the first two, and finally just the first one. 3. Practise right and left spirals; when the dog is on the inside, slow down and reward at their nose. 4. Successful attempt: the team circles the cones in the right order and the dog holds heel position throughout.",
              },
            },
            {
              name: {
                cs: "Parkur z 10 karet",
                en: "10-sign course",
              },
              procedure: {
                cs: "1. Postavte parkur z 10 cviků, které pes už zvládá, s rozestupy asi 3–5 m; každý cvik napište na kartu. 2. Projděte ho jednou bez psa a zapamatujte si pořadí. 3. Projděte ho se psem, mluvte na něj a chvalte ho; pamlsek dávejte jen po statickém cviku, když stojíte vedle psa. 4. Úspěšný pokus: celý parkur bez vynechané karty, bez opakování cviku a s prověšeným vodítkem nebo bez něj.",
                en: "1. Lay out a course of 10 exercises the dog already knows, 3–5 m apart; write each exercise on a sign. 2. Walk it once without the dog to learn the order. 3. Run it with the dog, talking to them and praising; give treats only after a static exercise, with you beside the dog. 4. Successful attempt: the whole course with no missed sign, no repeated exercise, and a slack lead or none.",
              },
            },
          ],
        },
      ],
    },
    {
      key: "dogdancing",
      shortName: {
        cs: "Dogdancing",
        en: "Dog dancing",
      },
      name: {
        cs: "Dogdancing – heelwork a freestyle",
        en: "Dog dancing – heelwork and freestyle",
      },
      description: {
        cs: "Sestava na hudbu, ve které pes s psovodem předvádějí prvky v pozicích u nohy (heelwork to music) a volné triky (freestyle). Cviky vycházejí z postupových zkoušek 1. stupně, na které může pes od 10 měsíců. Hodí se pro psy všech velikostí. Psa rozcvičujte, trénujte na neklouzavém povrchu a u mladých psů vynechte skoky, panáčkování a dlouhé couvání.",
        en: "A routine to music in which dog and handler perform moves in heel positions (heelwork to music) and free tricks (freestyle). The exercises follow the Czech level 1 dog dancing tests, open to dogs from 10 months. Suits dogs of any size. Warm the dog up, train on a non-slip surface, and leave out jumps, sitting up on the hind legs and long back-ups for young dogs.",
      },
      goals: [
        {
          name: {
            cs: "Triky na místě",
            en: "Tricks on the spot",
          },
          criterion: {
            cs: "Pes předvede každý trik na slovní povel nebo malý posunek bez pamlsku v ruce v 8 z 10 pokusů ve 3 trénincích po sobě.",
            en: "The dog performs each trick on a verbal cue or small hand signal, with no treat in your hand, in 8 of 10 attempts in 3 sessions in a row.",
          },
          exercises: [
            {
              name: {
                cs: "Otočka doleva a doprava",
                en: "Spin left and right",
              },
              procedure: {
                cs: "1. Pamlskem u nosu veďte psa v malém kruhu na místě a odměňte ho po celé otočce. 2. Návnadu zmenšujte na posunek a pro každý směr přidejte vlastní povel (např. „Točka“ a „Kolo“). 3. Nacvičte dvě otočky stejným směrem za sebou. 4. Úspěšný pokus: pes udělá dvě souvislé otočky požadovaným směrem, aniž by zvedl přední tlapy od země.",
                en: "1. With a treat at the dog's nose, lure them round in a small circle on the spot and reward after a full turn. 2. Fade the lure to a hand signal and add a cue for each direction (e.g. “Spin” and “Twist”). 3. Build up to two spins in a row in the same direction. 4. Successful attempt: the dog does two continuous spins in the asked direction without lifting their front paws off the ground.",
              },
            },
            {
              name: {
                cs: "Práce tlapek – střídavě levá a pravá",
                en: "Paw work – alternate left and right",
              },
              procedure: {
                cs: "1. Naučte psa zvedat pravou a levou tlapku zvlášť, každou na vlastní povel. 2. Pak je střídejte: levá, pravá, levá, pravá. 3. Odměňujte po dvou a nakonec po čtyřech pohybech. 4. Úspěšný pokus: pes na povely 4× střídavě zvedne tlapku a nesplete si stranu.",
                en: "1. Teach the dog to lift the right and the left paw separately, each on its own cue. 2. Then alternate them: left, right, left, right. 3. Reward after two and finally after four movements. 4. Successful attempt: the dog lifts a paw 4 times, alternating on cue, without mixing up the sides.",
              },
            },
            {
              name: {
                cs: "Póza – úklona na 4 doby",
                en: "Pose – bow for 4 counts",
              },
              procedure: {
                cs: "1. Ze stoje veďte pamlsek mezi předníma nohama k zemi a odměňte, jakmile pes sklopí hrudník a zadek zůstane nahoře. 2. Přidejte povel „Úklona“ a pamlsek nahraďte posunkem. 3. Prodlužujte výdrž a v duchu počítejte do čtyř. 4. Úspěšný pokus: pes se na jeden povel ukloní a vydrží 4 doby, aniž by si lehl.",
                en: "1. From a stand, guide a treat between the front legs to the floor and reward as soon as the chest goes down while the rear stays up. 2. Add the cue “Bow” and replace the treat with a hand signal. 3. Build duration, counting to four in your head. 4. Successful attempt: the dog bows on one cue and holds it for 4 counts without lying down.",
              },
            },
            {
              name: {
                cs: "Couvání rovně 4 kroky",
                en: "Back up straight 4 steps",
              },
              procedure: {
                cs: "1. Stůjte čelem ke psovi v úzké uličce (např. mezi zdí a lavičkou) a krokem k němu ho vyzvěte, ať couvne. 2. Odměňujte každý krok vzad pamlskem položeným mezi jeho přední tlapy. 3. Přidejte povel „Couvej“ a uličku postupně odstraňte. 4. Úspěšný pokus: pes couvne rovně aspoň o délku 4 vašich kroků, neposkakuje a nestaví se na zadní.",
                en: "1. Face the dog in a narrow lane (e.g. between a wall and a bench) and step towards them to invite a step back. 2. Reward each backward step by placing a treat between their front paws. 3. Add the cue “Back” and gradually remove the lane. 4. Successful attempt: the dog backs up straight for at least 4 of your steps, without hopping or rearing.",
              },
            },
          ],
        },
        {
          name: {
            cs: "Heelwork u levé a pravé nohy",
            en: "Heelwork on the left and right",
          },
          criterion: {
            cs: "Pes zvládne každý cvik bez pamlsku v ruce, s hudbou i bez ní, v 8 z 10 pokusů ve 3 trénincích po sobě.",
            en: "The dog succeeds at each exercise with no treat in your hand, with and without music, in 8 of 10 attempts in 3 sessions in a row.",
          },
          exercises: [
            {
              name: {
                cs: "Pozice u levé nohy 12 kroků",
                en: "Left-side heel for 12 steps",
              },
              procedure: {
                cs: "1. Naučte psa držet se ramenem u vaší levé nohy (pozice 1) a odměňujte ho v pozici. 2. Jděte rovně, zpočátku odměňujte každé 2–3 kroky, později až po 12 krocích. 3. Zkoušejte i jiná tempa, pomalé a rychlé. 4. Úspěšný pokus: pes ujde 12 kroků rovnoběžně a těsně u levé nohy, nepředbíhá a nezaostává.",
                en: "1. Teach the dog to keep their shoulder at your left leg (position 1), rewarding in position. 2. Walk straight, rewarding every 2–3 steps at first, then only after 12 steps. 3. Try other paces too, slow and fast. 4. Successful attempt: the dog walks 12 steps parallel and close to your left leg without forging or lagging.",
              },
            },
            {
              name: {
                cs: "Pozice u pravé nohy 12 kroků",
                en: "Right-side heel for 12 steps",
              },
              procedure: {
                cs: "1. Stejně jako vlevo naučte pozici u pravé nohy (pozice 2) s vlastním povelem. 2. Odměňujte pravou rukou u pravého boku, aby pes netáhl doleva. 3. Postupně prodlužujte na 12 kroků a zvolte jiné tempo než u levé strany. 4. Úspěšný pokus: pes ujde 12 kroků těsně u pravé nohy, rovnoběžně s vámi.",
                en: "1. Just as on the left, teach the position at your right leg (position 2) with its own cue. 2. Reward with your right hand at your right hip so the dog doesn't drift left. 3. Build up to 12 steps and use a different pace from the left side. 4. Successful attempt: the dog walks 12 steps close to your right leg, parallel to you.",
              },
            },
            {
              name: {
                cs: "Kruh v pozici u nohy oběma směry",
                en: "Circle in heel position both ways",
              },
              procedure: {
                cs: "1. Jděte se psem v pozici u nohy po kruhu o průměru asi 3 m po směru hodinových ručiček. 2. Pak jděte stejný kruh proti směru ve stejné pozici; pes je jednou vně, jednou uvnitř. 3. Když je pes uvnitř, zpomalte a odměňujte u jeho nosu. 4. Úspěšný pokus: pes udrží pozici po celém kruhu v obou směrech.",
                en: "1. Walk a circle about 3 m across, clockwise, with the dog in heel position. 2. Then walk the same circle anticlockwise in the same position; the dog is once on the outside, once on the inside. 3. When the dog is on the inside, slow down and reward at their nose. 4. Successful attempt: the dog holds the position through the whole circle in both directions.",
              },
            },
            {
              name: {
                cs: "Pivot o 180° u nohy",
                en: "180° pivot at heel",
              },
              procedure: {
                cs: "1. Naučte psa položit přední tlapy na nízkou podložku a zadníma nohama ji obcházet. 2. Postavte se vedle psa a otáčejte se na místě; pes se otáčí kolem osy ramen a drží se u nohy. 3. Podložku postupně odeberte a nacvičte pivot vlevo i vpravo. 4. Úspěšný pokus: pes se otočí o 180° na místě, zůstane u vaší nohy a nepostoupí dopředu.",
                en: "1. Teach the dog to put their front paws on a low platform and walk their hind legs around it. 2. Stand beside the dog and turn on the spot; the dog pivots around their shoulders and stays at your leg. 3. Gradually remove the platform and practise pivoting on the left and right. 4. Successful attempt: the dog pivots 180° on the spot, stays at your leg and doesn't step forward.",
              },
            },
          ],
        },
        {
          name: {
            cs: "Pohyb kolem psovoda a sestava",
            en: "Moving around the handler and a routine",
          },
          criterion: {
            cs: "Pes zvládne obíhání a slalom mezi nohama v 8 z 10 pokusů a sestavu na hudbu se všemi plánovanými prvky ve 4 z 5 pokusů, obojí ve 2 trénincích po sobě.",
            en: "The dog succeeds at circling and leg weaves in 8 of 10 attempts and at the routine to music with all planned moves in 4 of 5 attempts, both in 2 sessions in a row.",
          },
          exercises: [
            {
              name: {
                cs: "Obíhání psovoda dokola",
                en: "Circle around the handler",
              },
              procedure: {
                cs: "1. Pamlskem veďte psa kolem sebe: z levé strany za zády na pravou a zpět dopředu. 2. Návnadu zmenšujte na posunek a přidejte povel (např. „Kolem“). 3. Nacvičte oba směry. 4. Úspěšný pokus: pes vás oběhne celým kruhem, proběhne vám za zády a vrátí se do výchozí pozice.",
                en: "1. Lure the dog around you: from your left side, behind your back to your right and back to the front. 2. Fade the lure to a hand signal and add a cue (e.g. “Around”). 3. Practise both directions. 4. Successful attempt: the dog completes a full circle around you, passing behind your back, and returns to the starting position.",
              },
            },
            {
              name: {
                cs: "Slalom mezi nohama 8 kroků",
                en: "Leg weaves for 8 steps",
              },
              procedure: {
                cs: "1. Stůjte rozkročmo a pamlskem protáhněte psa pod jednou nohou zezadu dopředu; odměňte. 2. Udělejte krok druhou nohou a protáhněte ho opačně, takže vzniká osmička. 3. Postupně jděte plynule vpřed a návnadu nahraďte posunkem. 4. Úspěšný pokus: pes se proplétá mezi vašima nohama po dobu 8 kroků a žádnou mezeru nevynechá.",
                en: "1. Stand with your feet apart and lure the dog under one leg from back to front; reward. 2. Step forward with the other leg and lure them through the opposite way, making a figure of eight. 3. Gradually walk forward smoothly and replace the lure with a hand signal. 4. Successful attempt: the dog weaves through your legs for 8 steps without skipping a gap.",
              },
            },
            {
              name: {
                cs: "Sestava na hudbu 60 s",
                en: "60-second routine to music",
              },
              procedure: {
                cs: "1. Vyberte hudbu, jejíž tempo odpovídá pohybu psa, a zkraťte ji na asi 60 s. 2. Sestavte pořadí 6–8 prvků, které pes umí (heelwork, otočky, tlapky, póza, slalom), a projděte ho bez psa. 3. Zatancujte sestavu se psem, chvalte ho a odměňte až po skončení hudby. 4. Úspěšný pokus: pes předvede všechny plánované prvky v daném pořadí a zůstane soustředěný až do konce.",
                en: "1. Pick music whose tempo suits the dog's movement and cut it to about 60 s. 2. Put 6–8 moves the dog knows into an order (heelwork, spins, paw work, pose, weaves) and walk through it without the dog. 3. Dance it with the dog, praise them and reward only when the music ends. 4. Successful attempt: the dog performs all planned moves in order and stays focused until the end.",
              },
            },
          ],
        },
      ],
    },
  ],
};
