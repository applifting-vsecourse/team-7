// Generated from the F-63 content (mushing.json) by to-ts.mjs; edit the JSON and regenerate.
// Sources:
// - https://www.siberianhuskycz.com/zavody/pravidla-a-rady/organizacni-rad-a-pravidla-pro-canicross-a-bikejoring/
// - https://www.canikosir.cz/pravidla/
// - https://www.nonstopdogwear.com/en/magazine/how-to-start-canicross/
// - https://www.nonstopdogwear.com/en-int/magazine/how-to-start-bikejoring
// - https://blog.dogfit.co.uk/2025/11/2-wheels-4-paws-welcome-to-bikejor/
// - https://www.akc.org/expert-advice/health/canicross-goes-beyond-running-with-dogs/
// - https://ifauna.cz/clanky/5206-musa-pedestris-aneb-abeceda-dog-trekkingu-4.html
// - https://ifauna.cz/clanky/5164-musa-pedestris-aneb-abeceda-dog-trekkingu-2.html
// - https://frystak.tombru.com/sourad.html
// - https://www.novinky.cz/clanek/bydleni-jak-na-to-na-dogtrekking-se-musi-pes-i-jeho-pan-dobre-pripravit-40026498
// - https://cc.cz/canicross-s-nejpovolanejsimi-simon-cipro-a-fenka-loype-nam-v-blatu-a-desti-ukazali-kouzlo-behu-se-psem/
import type { CatalogCategory } from "./types";

export const mushing: CatalogCategory = {
  key: "mushing",
  name: {
    cs: "Tažné a běžecké sporty",
    en: "Pulling & running sports",
  },
  description: {
    cs: "Sporty, ve kterých pes v tažném postroji táhne psovoda při běhu, na kole nebo na dlouhé túře. Hodí se pro zdravé, dospělé a pohybově založené psy. Před začátkem zajděte k veterináři a zátěž zvyšujte postupně.",
    en: "Sports where the dog pulls the handler in a harness while running, cycling or hiking long distances. Best for healthy, fully grown, active dogs. See your vet before you start and build up the load gradually.",
  },
  disciplines: [
    {
      key: "canicross",
      shortName: {
        cs: "Canicross",
        en: "Canicross",
      },
      name: {
        cs: "Canicross – začátky",
        en: "Canicross – first steps",
      },
      description: {
        cs: "Běh se psem, který v tažném postroji táhne psovoda; je k jeho bedernímu pásu připnutý šňůrou s amortizérem. Hodí se pro zdravé a aktivní psy i psovody, kteří rádi běhají v terénu. Začněte po prohlídce u veterináře, nejdřív ve 12 měsících (velká plemena v 15–18 měsících). Běhejte na měkkém povrchu, při teplotě pod 15–20 °C, kontrolujte tlapky a jako začátečníci nejvýš 3× týdně.",
        en: "Running with your dog pulling you in a harness, clipped to your waist belt with a bungee line. Suits healthy, active dogs and handlers who enjoy trail running. Start after a vet check and not before 12 months (large breeds 15–18 months). Run on soft ground below 15–20 °C, check the paws, and as a beginner keep to at most 3 runs a week.",
      },
      goals: [
        {
          name: {
            cs: "Povely v chůzi",
            en: "Cues at a walk",
          },
          criterion: {
            cs: "Pes zvládne každý povel v chůzi na známé trase v 8 z 10 pokusů ve 3 trénincích po sobě.",
            en: "The dog responds to each cue at a walk on a familiar trail in 8 of 10 attempts in 3 sessions in a row.",
          },
          exercises: [
            {
              name: {
                cs: "Vpřed (hike) ze stání",
                en: "Hike (go) from a standstill",
              },
              procedure: {
                cs: "1. Pes stojí v postroji před vámi a šňůra je volná. 2. Řekněte jednou „Vpřed“ (nebo „Hike“) a vykročte. 3. Ve chvíli, kdy pes vyrazí a napne šňůru, ho nadšeně pochvalte. 4. Povel neopakujte; když pes nevyrazí, pomůže pomocník, který ho kousek před ním přivolává. 5. Úspěšný pokus: pes do 3 s vyrazí dopředu a napne šňůru.",
                en: "1. The dog stands in harness in front of you with the line slack. 2. Say “Hike” (or “Go”) once and step off. 3. Praise enthusiastically the moment the dog moves off and tightens the line. 4. Don't repeat the cue; if the dog doesn't go, have a helper call them from a few metres ahead. 5. Successful attempt: the dog moves forward and tightens the line within 3 s.",
              },
            },
            {
              name: {
                cs: "Stůj (whoa) z chůze",
                en: "Whoa (stop) from a walk",
              },
              procedure: {
                cs: "1. Jděte svižně za psem, šňůra je napnutá. 2. Řekněte „Stůj“ (nebo „Whoa“) a sami zpomalte do zastavení. 3. Jakmile se pes zastaví, odměňte ho pamlskem u hlavy. 4. Postupně přestaňte zpomalovat jako první. 5. Úspěšný pokus: pes se do 3 kroků zastaví a stojí, dokud ho nepustíte dál.",
                en: "1. Walk briskly behind the dog with the line taut. 2. Say “Whoa” (or “Stop”) and slow yourself to a halt. 3. Reward with a treat at the dog's head as soon as they stop. 4. Gradually stop being the first to slow down. 5. Successful attempt: the dog stops within 3 steps and stays standing until released.",
              },
            },
            {
              name: {
                cs: "Vpravo (gee) na rozcestí",
                en: "Gee (right) at a junction",
              },
              procedure: {
                cs: "1. Cvičte na stezkách s rozcestími, ne na volné ploše. 2. Asi 3 m před odbočkou řekněte jméno psa a „Vpravo“ (nebo „Gee“); zpočátku ukažte rukou nebo jděte vpravo s ním. 3. Za správné odbočení ho hned pochvalte. 4. Nejdřív naučte jeden směr a až potom druhý. 5. Úspěšný pokus: pes odbočí vpravo jen na slovní povel, bez vedení rukou.",
                en: "1. Train on trails with junctions, not on open ground. 2. About 3 m before the turn, say the dog's name and “Gee” (or “Right”); at first, point or walk right with the dog. 3. Praise the right turn immediately. 4. Teach one direction fully before the other. 5. Successful attempt: the dog turns right on the verbal cue alone, with no hand guidance.",
              },
            },
            {
              name: {
                cs: "Vlevo (haw) na rozcestí",
                en: "Haw (left) at a junction",
              },
              procedure: {
                cs: "1. Začněte, až pes spolehlivě zvládá „Vpravo“. 2. Asi 3 m před odbočkou řekněte jméno psa a „Vlevo“ (nebo „Haw“); zpočátku ukažte rukou. 3. Za správné odbočení ho hned pochvalte. 4. Pak na rozcestích střídejte oba směry v náhodném pořadí. 5. Úspěšný pokus: pes odbočí vlevo jen na slovní povel, bez vedení rukou.",
                en: "1. Start once “Gee” is reliable. 2. About 3 m before the turn, say the dog's name and “Haw” (or “Left”); at first, point with your hand. 3. Praise the correct turn immediately. 4. Then mix both directions at junctions in random order. 5. Successful attempt: the dog turns left on the verbal cue alone, with no hand guidance.",
              },
            },
          ],
        },
        {
          name: {
            cs: "Tah v postroji",
            en: "Pulling in harness",
          },
          criterion: {
            cs: "Pes táhne 5 minut v chůzi s napnutou šňůrou a vydrží 10 s v line-outu, obojí v 8 z 10 pokusů ve 3 trénincích po sobě.",
            en: "The dog pulls for 5 minutes at a walk on a taut line and holds a 10 s line-out, both in 8 of 10 attempts in 3 sessions in a row.",
          },
          exercises: [
            {
              name: {
                cs: "Napnutí šňůry 30 s v chůzi",
                en: "Taut line for 30 s at a walk",
              },
              procedure: {
                cs: "1. Postroj psovi oblékněte až těsně před tréninkem, aby věděl, že jde o práci. 2. Jděte za psem a pochvalte ho pokaždé, když se opře do postroje. 3. Když šňůra povolí, zastavte se a počkejte, až ji pes znovu napne; netahejte ho a netrestejte. 4. Dobu postupně prodlužujte. 5. Úspěšný pokus: šňůra je 30 s souvisle napnutá.",
                en: "1. Put the harness on just before training so it means work. 2. Walk behind the dog and praise every time they lean into the harness. 3. If the line goes slack, stop and wait for the dog to tighten it again; no tugging, no corrections. 4. Build up the time gradually. 5. Successful attempt: the line stays taut for 30 s straight.",
              },
            },
            {
              name: {
                cs: "Line-out 5 s",
                en: "Line-out for 5 s",
              },
              procedure: {
                cs: "1. Stůjte na místě a nechte psa dojít dopředu na konec šňůry. 2. Ve chvíli, kdy stojí čelem vpřed a šňůra je napnutá, řekněte „Line-out“ a odměňte ho pamlskem hozeným před něj. 3. Když se otočí k vám, v klidu ho vraťte zpět a zkuste to znovu. 4. Dobu postupně prodlužujte. 5. Úspěšný pokus: pes 5 s stojí čelem vpřed s napnutou šňůrou.",
                en: "1. Stand still and let the dog walk forward to the end of the line. 2. When they face forward with the line taut, say “Line out” and reward by tossing a treat in front of them. 3. If they turn back to you, calmly reset and try again. 4. Build the duration gradually. 5. Successful attempt: the dog stands facing forward on a taut line for 5 s.",
              },
            },
            {
              name: {
                cs: "Tah v chůzi 5 minut",
                en: "Pull at a walk for 5 min",
              },
              procedure: {
                cs: "1. Vyberte rovnou a klidnou lesní cestu. 2. Pošlete psa povelem „Vpřed“ a jděte svižně 5 minut. 3. Tah chvalte hlasem; když se pes zastaví očichávat, počkejte a znovu ho pošlete povelem. 4. Pokus končí po 5 minutách. 5. Úspěšný pokus: pes táhne celou dobu a zastaví se nejvýš dvakrát.",
                en: "1. Pick a flat, quiet forest track. 2. Send the dog with “Hike” and walk briskly for 5 minutes. 3. Praise the pulling with your voice; if the dog stops to sniff, wait and send them on with the cue. 4. The attempt ends after 5 minutes. 5. Successful attempt: the dog pulls throughout and stops at most twice.",
              },
            },
          ],
        },
        {
          name: {
            cs: "Běh a kondice",
            en: "Running and conditioning",
          },
          criterion: {
            cs: "Pes uběhne 6 úseků s napnutou šňůrou a mine jiného psa bez zastavení, obojí v 8 z 10 pokusů ve 3 trénincích po sobě.",
            en: "The dog completes 6 running intervals on a taut line and passes another dog without stopping, both in 8 of 10 attempts in 3 sessions in a row.",
          },
          exercises: [
            {
              name: {
                cs: "Běh 1 min / chůze 2 min × 6",
                en: "Run 1 min / walk 2 min × 6",
              },
              procedure: {
                cs: "1. Psa nejdřív 5–10 minut rozejděte. 2. Pošlete ho „Vpřed“, minutu běžte a pak 2 minuty jděte; opakujte 6×. Každý běžecký úsek je jeden pokus. 3. Po tréninku zvolněte do chůze a zkontrolujte tlapky. 4. Při teplotě nad 15–20 °C trénink zkraťte nebo odložte. 5. Úspěšný pokus: pes běží celý úsek před vámi s napnutou šňůrou.",
                en: "1. Warm up with 5–10 minutes of walking. 2. Send the dog with “Hike”, run for 1 minute, then walk for 2 minutes; repeat 6 times. Each running interval is one attempt. 3. Cool down at a walk and check the paws afterwards. 4. Above 15–20 °C, shorten or skip the session. 5. Successful attempt: the dog runs ahead on a taut line for the whole interval.",
              },
            },
            {
              name: {
                cs: "Pomalu (easy) z běhu do klusu",
                en: "Easy: from run to trot",
              },
              procedure: {
                cs: "1. Cvičte na mírném svahu nebo před zatáčkou. 2. Při běhu řekněte klidně a protáhle „Pomalu“ (nebo „Easy“) a sami zvolněte. 3. Jakmile pes zpomalí, tiše ho pochvalte. 4. Po pár krocích ho znovu pošlete „Vpřed“. 5. Úspěšný pokus: pes do 5 m zpomalí, šňůra přitom úplně nepovolí ani necukne.",
                en: "1. Practise on a gentle slope or before a bend. 2. While running, say “Easy” in a calm, drawn-out voice and slow down yourself. 3. Praise quietly as soon as the dog slows. 4. After a few strides, send them on again with “Hike”. 5. Successful attempt: the dog slows within 5 m without the line going fully slack or jerking.",
              },
            },
            {
              name: {
                cs: "Míjení psa (on by)",
                en: "On by: passing another dog",
              },
              procedure: {
                cs: "1. Domluvte se s pomocníkem, jehož pes stojí nebo jde u kraje cesty. 2. Začněte v chůzi a s velkým odstupem. 3. Asi 10 m před ním řekněte „Dál“ (nebo „On by“) a pochvalte psa, když se dívá dopředu. 4. Odstup postupně zmenšujte a zrychlujte až do běhu. 5. Úspěšný pokus: pes mine druhého psa bez zastavení, výpadu a štěkání.",
                en: "1. Arrange a helper whose dog stands or walks at the side of the trail. 2. Start at a walk with plenty of distance. 3. About 10 m before the other dog, say “On by” and praise your dog for looking ahead. 4. Gradually reduce the distance and build up to a run. 5. Successful attempt: your dog passes without stopping, lunging or barking.",
              },
            },
          ],
        },
      ],
    },
    {
      key: "bikejoring",
      shortName: {
        cs: "Bikejöring",
        en: "Bikejoring",
      },
      name: {
        cs: "Bikejöring – začátky",
        en: "Bikejoring – first steps",
      },
      description: {
        cs: "Pes v tažném postroji běží před horským kolem, ke kterému je připnutý šňůrou s amortizérem přes rameno (anténu). Hodí se pro psy, kteří už zvládají povely z canicrossu. Pes musí být plně dospělý (12–18 měsíců) a mít za sebou prohlídku u veterináře. Přilba a rukavice jsou povinné. Jezděte po měkkých a rovných cestách při teplotě pod 15 °C, kratší úseky než při canicrossu a zpočátku 1–2× týdně.",
        en: "The dog runs in a pulling harness in front of a mountain bike, on a bungee line attached via a bike antenna. Suits dogs that already know their canicross cues. The dog must be fully grown (12–18 months) and vet-checked. A helmet and gloves are a must. Ride flat, soft trails below 15 °C, keep runs shorter than in canicross, and start with 1–2 sessions a week.",
      },
      goals: [
        {
          name: {
            cs: "Seznámení s kolem",
            en: "Getting used to the bike",
          },
          criterion: {
            cs: "Pes jde 5 minut klidně vedle kola i před ním a neuskakuje od něj v 8 z 10 pokusů ve 3 trénincích po sobě.",
            en: "The dog moves calmly beside and ahead of the bike for 5 minutes without shying away from it in 8 of 10 attempts in 3 sessions in a row.",
          },
          exercises: [
            {
              name: {
                cs: "Chůze vedle tlačeného kola 2 min",
                en: "Walk beside a pushed bike for 2 min",
              },
              procedure: {
                cs: "1. Pomocník tlačí kolo a vy vedete psa na vodítku vedle něj. 2. Nechte kolo cvakat a občas zabrzděte, aby si pes zvykl na zvuky. 3. Klidné chování průběžně odměňujte. 4. Postupně se ke kolu přibližujte. 5. Úspěšný pokus: pes jde 2 minuty uvolněně, neuskakuje a nezastavuje se.",
                en: "1. A helper pushes the bike while you walk the dog on lead beside it. 2. Let the freewheel click and brake now and then so the dog gets used to the sounds. 3. Reward calm behaviour throughout. 4. Gradually move closer to the bike. 5. Successful attempt: the dog walks for 2 minutes relaxed, without shying or stopping.",
              },
            },
            {
              name: {
                cs: "Line-out před kolem 5 s",
                en: "Line-out in front of the bike for 5 s",
              },
              procedure: {
                cs: "1. Připněte psa šňůrou k anténě kola a stůjte nad kolem se zabrzděnými brzdami. 2. Nechte psa dojít na konec šňůry. 3. Když stojí čelem vpřed a šňůra je napnutá, řekněte „Line-out“ a odměňte ho. 4. Když se otočí ke kolu, v klidu ho vraťte dopředu. 5. Úspěšný pokus: pes 5 s stojí čelem vpřed s napnutou šňůrou.",
                en: "1. Clip the dog to the bike antenna and stand over the bike with the brakes on. 2. Let the dog walk out to the end of the line. 3. When they face forward with the line taut, say “Line out” and reward. 4. If they turn back to the bike, calmly reset them facing forward. 5. Successful attempt: the dog faces forward on a taut line for 5 s.",
              },
            },
            {
              name: {
                cs: "Klus před pomalu jedoucím kolem 1 min",
                en: "Trot ahead of a slow bike for 1 min",
              },
              procedure: {
                cs: "1. Pomocník vede psa na vodítku před vámi a vy jedete krokem za ním. 2. Pošlete psa „Vpřed“ a jeďte pomalu za ním. 3. Pomocník psa postupně přestává vést. 4. Klidný pohyb dopředu chvalte hlasem. 5. Úspěšný pokus: pes minutu klusá před kolem, nekříží mu přední kolo a neotáčí se.",
                en: "1. A helper leads the dog on lead ahead of you while you ride at walking pace. 2. Send the dog with “Hike” and ride slowly behind. 3. The helper gradually stops leading. 4. Praise steady forward movement with your voice. 5. Successful attempt: the dog trots ahead for 1 minute without crossing the front wheel or turning back.",
              },
            },
          ],
        },
        {
          name: {
            cs: "První jízdy v postroji",
            en: "First runs in harness",
          },
          criterion: {
            cs: "Pes uběhne 3 úseky po 500 m s napnutou šňůrou, zastaví na povel a odbočí na povel v 8 z 10 pokusů ve 3 trénincích po sobě.",
            en: "The dog runs 3 stretches of 500 m on a taut line, stops on cue and turns on cue in 8 of 10 attempts in 3 sessions in a row.",
          },
          exercises: [
            {
              name: {
                cs: "Úsek 100 m v tahu",
                en: "100 m stretch in harness",
              },
              procedure: {
                cs: "1. Vyberte rovnou, klidnou a neklouzavou cestu bez aut. 2. Z line-outu pošlete psa „Vpřed“ a rozjeďte se jen tak rychle, jak pes táhne; kolo psa nikdy nepředjíždí. 3. Po 100 m zastavte a pochvalte ho. 4. Úsek prodlužujte, jen dokud je pes stále nadšený. 5. Úspěšný pokus: pes táhne celých 100 m před kolem s napnutou šňůrou.",
                en: "1. Choose a flat, quiet, non-slippery trail with no cars. 2. From a line-out, send the dog with “Hike” and ride only as fast as the dog pulls; the bike never overtakes the dog. 3. Stop after 100 m and praise. 4. Lengthen the stretch only while the dog stays keen. 5. Successful attempt: the dog pulls for the full 100 m ahead of the bike on a taut line.",
              },
            },
            {
              name: {
                cs: "Stůj (whoa) z jízdy",
                en: "Whoa (stop) while riding",
              },
              procedure: {
                cs: "1. Jeďte po rovině tempem klusajícího psa. 2. Řekněte „Stůj“ (nebo „Whoa“) a plynule brzděte zadní brzdou, aby povolená šňůra nespadla do předního kola. 3. Když pes zastaví, pochvalte ho a odměňte. 4. Pak ho znovu pošlete „Vpřed“. 5. Úspěšný pokus: pes zastaví do 5 m a zůstane stát čelem vpřed, neotočí se ke kolu.",
                en: "1. Ride on the flat at the dog's trotting pace. 2. Say “Whoa” (or “Stop”) and brake smoothly with the rear brake so the line doesn't go slack into the front wheel. 3. Praise and reward when the dog stops. 4. Send them on again with “Hike”. 5. Successful attempt: the dog stops within 5 m and stays facing forward, not turning back to the bike.",
              },
            },
            {
              name: {
                cs: "Odbočení vpravo/vlevo z jízdy",
                en: "Gee/haw turn while riding",
              },
              procedure: {
                cs: "1. Cvičte na rozcestích, která pes zná z canicrossu. 2. Zpomalte ještě před zatáčkou, ne v ní. 3. Asi 5 m před odbočkou řekněte jméno psa a „Vpravo“ nebo „Vlevo“ (gee/haw). 4. Za správné odbočení psa pochvalte. 5. Úspěšný pokus: pes odbočí na povel na správnou stranu a šňůra zůstane napnutá.",
                en: "1. Practise at junctions the dog knows from canicross. 2. Brake before the bend, not in it. 3. About 5 m before the turn, say the dog's name and “Gee” or “Haw”. 4. Praise the correct turn. 5. Successful attempt: the dog turns the right way on cue and the line stays taut.",
              },
            },
          ],
        },
        {
          name: {
            cs: "Jízda v terénu",
            en: "Trail riding",
          },
          criterion: {
            cs: "Pes ujede 3 km se zastaveními, zatáčkami a míjením a až do konce táhne bez známek únavy ve 3 trénincích po sobě.",
            en: "The dog completes 3 km with stops, turns and passing, pulling to the end without signs of fatigue, in 3 sessions in a row.",
          },
          exercises: [
            {
              name: {
                cs: "Pomalu (easy) před sjezdem",
                en: "Easy before a downhill",
              },
              procedure: {
                cs: "1. Před mírným sjezdem řekněte klidně „Pomalu“ (nebo „Easy“). 2. Brzděte plynule, aby pes nikdy nemusel běžet rychleji, než chce. 3. Za zpomalení ho tiše pochvalte. 4. Na prudkých sjezdech psa raději odepněte nebo sesedněte z kola. 5. Úspěšný pokus: pes zpomalí do klusu, kolo ho nedohání a šňůra necukne.",
                en: "1. Before a gentle downhill, say “Easy” calmly. 2. Brake smoothly so the dog never has to run faster than they want. 3. Praise quietly for slowing. 4. On steep descents, unclip the dog or get off and walk. 5. Successful attempt: the dog slows to a trot, the bike doesn't catch up with them and the line doesn't jerk.",
              },
            },
            {
              name: {
                cs: "Míjení chodce nebo psa (on by)",
                en: "On by: passing a walker or dog",
              },
              procedure: {
                cs: "1. Domluvte se s pomocníkem, který stojí u kraje cesty, nejdřív sám, později se psem. 2. Zpomalte. 3. Asi 15 m před ním řekněte „Dál“ (nebo „On by“). 4. Když se pes dívá dopředu, pochvalte ho a v klidu pomocníka miňte. 5. Úspěšný pokus: pes mine pomocníka bez zastavení, uhnutí k němu a výpadu.",
                en: "1. Arrange a helper at the side of the trail, first alone, later with a dog. 2. Slow down. 3. About 15 m before them, say “On by”. 4. Praise the dog for looking ahead as you pass calmly. 5. Successful attempt: the dog passes without stopping, veering towards the helper or lunging.",
              },
            },
            {
              name: {
                cs: "Souvislý úsek 1 km",
                en: "Continuous 1 km run",
              },
              procedure: {
                cs: "1. Psa nejdřív 5–10 minut rozejděte a rozklusejte. 2. Jeďte 1 km po měkké cestě tempem psa. 3. Pak zvolněte, nabídněte mu trochu vody a zkontrolujte tlapky. 4. Když je nad 15 °C nebo pes zpomaluje, trénink ukončete. 5. Úspěšný pokus: pes táhne celý kilometr s napnutou šňůrou a na konci je stále ochotný.",
                en: "1. Warm up for 5–10 minutes at a walk and trot. 2. Ride 1 km on soft ground at the dog's pace. 3. Cool down, offer a little water and check the paws. 4. Stop the session if it's above 15 °C or the dog slows down. 5. Successful attempt: the dog pulls the whole kilometre on a taut line and is still keen at the end.",
              },
            },
          ],
        },
      ],
    },
    {
      key: "dogtrekking",
      shortName: {
        cs: "Dogtrekking",
        en: "Dogtrekking",
      },
      name: {
        cs: "Dogtrekking – dálkové pochody",
        en: "Dogtrekking – long-distance hiking",
      },
      description: {
        cs: "Dálkový pochod se psem v postroji připnutým k bedernímu pásu nebo na vodítku. Trasu hledáte podle mapy a procházíte kontroly. Akce mají od zhruba 30 km (midy) po 80–100 km i víc, s povinnou výbavou: mapa, čelovka, miska, voda, lékárnička a dvě botičky na psa. Pes musí mít alespoň 12 měsíců a být zdravý; krátkonosým plemenům se nehodí. Kondici i tlapky budujte postupně a v teple dbejte na stín a dostatek vody.",
        en: "Long-distance hiking with your dog in a harness clipped to your waist belt or on a lead, finding your way by map between checkpoints. Events range from about 30 km (mid) to 80–100 km and more, with mandatory gear: map, headlamp, bowl, water, first-aid kit and two booties per dog. The dog must be at least 12 months old and healthy; it is not suitable for flat-faced breeds. Build fitness and paw pads gradually, and plan for shade and plenty of water in warm weather.",
      },
      goals: [
        {
          name: {
            cs: "Ovládání psa na trase",
            en: "Control on the trail",
          },
          criterion: {
            cs: "Pes zvládne každý cvik na 10km výletu v členitém terénu v 8 z 10 pokusů na 3 výletech po sobě.",
            en: "The dog succeeds at each exercise on a 10 km outing in mixed terrain in 8 of 10 attempts on 3 outings in a row.",
          },
          exercises: [
            {
              name: {
                cs: "Za paty na sestupu",
                en: "Behind me on a descent",
              },
              procedure: {
                cs: "1. Na rovině řekněte „Za paty“ a pamlskem u levé nohy naveďte psa za sebe. 2. Odměňte ho, když jde za vaší levou nohou. 3. Návnadu postupně vynechte a cvičte na sestupech a v kamenitém terénu. 4. Tah obnovte povelem „Vpřed“. 5. Úspěšný pokus: pes se na povel zařadí za vás a 20 m netáhne.",
                en: "1. On the flat, say “Behind” and guide the dog behind you with a treat at your left leg. 2. Reward when they walk behind your left leg. 3. Fade the lure and practise on descents and rocky ground. 4. Resume pulling with “Hike”. 5. Successful attempt: the dog drops behind you on cue and doesn't pull for 20 m.",
              },
            },
            {
              name: {
                cs: "Překonání překážky na trase",
                en: "Cross a trail obstacle",
              },
              procedure: {
                cs: "1. Vyhledejte padlý kmen, potok, lávku nebo kamenitý úsek. 2. Zpomalte a psa převeďte krokem, ne v tahu. 3. Za klidné překonání ho pochvalte a odměňte. 4. Překážky postupně ztěžujte. 5. Úspěšný pokus: pes překážku v klidu překoná, neodmítá ji, neskáče do vás a necuká šňůrou.",
                en: "1. Find a fallen log, stream, footbridge or rocky stretch. 2. Slow down and lead the dog across at a walk, not pulling. 3. Praise and reward a calm crossing. 4. Make the obstacles gradually harder. 5. Successful attempt: the dog crosses calmly, without refusing, jumping on you or jerking the line.",
              },
            },
            {
              name: {
                cs: "Klidné odložení na přestávce 10 min",
                en: "Settle during a 10 min break",
              },
              procedure: {
                cs: "1. Na zastávce rozložte karimatku nebo deku a dejte psovi povel „Lehni“. 2. Zpočátku ho odměňujte často, později jen občas. 3. Sami si sedněte, napijte se a najezte. 4. Délku přestávky prodlužujte. 5. Úspěšný pokus: pes 10 minut klidně leží, nesnaží se odejít a nepiští.",
                en: "1. At a stop, lay out a mat or blanket and cue “Down”. 2. Reward often at first, then occasionally. 3. Sit down, drink and eat yourself. 4. Lengthen the break gradually. 5. Successful attempt: the dog lies calmly for 10 minutes without trying to leave or whining.",
              },
            },
          ],
        },
        {
          name: {
            cs: "Výdrž a péče o psa",
            en: "Endurance and dog care",
          },
          criterion: {
            cs: "Pes ujde 20 km za den, cestou pije a žere a nemá poraněné polštářky. Druhý den je čilý a nekulhá.",
            en: "The dog walks 20 km in a day, drinks and eats along the way and finishes with uninjured pads. The next day they are lively and not lame.",
          },
          exercises: [
            {
              name: {
                cs: "Prohlídka tlapek 30 s",
                en: "Paw check for 30 s",
              },
              procedure: {
                cs: "1. Doma psovi zvedněte tlapku, prohlédněte polštářky a prostor mezi prsty a odměňte ho. 2. Postupně prohlížejte všechny čtyři tlapy. 3. Na výletě kontrolujte tlapy na každé přestávce. 4. Hledejte odřeniny, trny a praskliny. 5. Úspěšný pokus: pes v klidu vydrží 30 s prohlídku všech čtyř tlap.",
                en: "1. At home, lift a paw, look at the pads and between the toes, and reward. 2. Work up to all four paws. 3. On outings, check the paws at every break. 4. Look for abrasions, thorns and cracks. 5. Successful attempt: the dog stays calm through a 30 s check of all four paws.",
              },
            },
            {
              name: {
                cs: "Chůze v botičkách 5 min",
                en: "Walk in booties for 5 min",
              },
              procedure: {
                cs: "1. Nasaďte psovi jednu botičku a hned ho odměňte. 2. Postupně nasazujte všechny čtyři. 3. Ujděte se psem pár kroků a pochvalte ho, když jde normálně. 4. Dobu prodlužujte; botičky patří do povinné výbavy, proto je trénujte předem. 5. Úspěšný pokus: pes jde 5 minut v botičkách přirozeně, nevyklepává je a neokusuje.",
                en: "1. Put on one bootie and reward straight away. 2. Gradually work up to all four. 3. Walk a few steps together and praise normal movement. 4. Build up the time; booties are mandatory gear, so train them in advance. 5. Successful attempt: the dog walks naturally in booties for 5 minutes without shaking them off or chewing them.",
              },
            },
            {
              name: {
                cs: "Túra s postupným prodlužováním",
                en: "Hike with a gradual increase",
              },
              procedure: {
                cs: "1. Začněte túrou 10 km a každou další prodlužte nejvýš o 3–5 km, až na 20 km; každá túra je jeden pokus. 2. Každou hodinu udělejte pauzu s vodou z misky. 3. V teple jděte stínem, ráno nebo večer. 4. Druhý den zkontrolujte, zda pes nekulhá a má zdravé tlapky. 5. Úspěšný pokus: pes dojde ochotně, nekulhá a nemá odřené polštářky.",
                en: "1. Start with a 10 km hike and add no more than 3–5 km per outing, up to 20 km; each hike is one attempt. 2. Take a break with water from a bowl every hour. 3. In warm weather, walk in the shade, in the morning or evening. 4. The next day, check for lameness and sore paws. 5. Successful attempt: the dog finishes willingly, with no lameness and no worn pads.",
              },
            },
          ],
        },
        {
          name: {
            cs: "Navigace a dálkový pochod",
            en: "Navigation and long distance",
          },
          criterion: {
            cs: "Trasu kolem 30 km (mid) projdete podle mapy, najdete všechny kontroly v plánovaném čase a pes je v cíli v dobré kondici.",
            en: "You complete a route of about 30 km (mid) by map, reach every checkpoint within the planned time, and the dog finishes in good condition.",
          },
          exercises: [
            {
              name: {
                cs: "Volba cesty na rozcestí podle mapy",
                en: "Pick the route at a junction by map",
              },
              procedure: {
                cs: "1. Před každým rozcestím si podle mapy a značení určete směr; každé rozcestí je jeden pokus. 2. Psa pošlete povelem „Vpravo“ nebo „Vlevo“. 3. Volbu po pár stech metrech ověřte podle terénu nebo GPS. 4. Rozcestí si zapisujte. 5. Úspěšný pokus: zvolíte správnou cestu napoprvé a pes odbočí na povel.",
                en: "1. Before each junction, work out the direction from the map and trail markings; each junction is one attempt. 2. Send the dog with “Gee” or “Haw”. 3. Check your choice after a few hundred metres against the terrain or GPS. 4. Log the junctions. 5. Successful attempt: you take the right path first time and the dog turns on cue.",
              },
            },
            {
              name: {
                cs: "Nalezení kontroly",
                en: "Find a checkpoint",
              },
              procedure: {
                cs: "1. Pomocník nebo vy sami vyznačte na mapě kontroly, například rozcestník, vrchol nebo studánku; každá kontrola je jeden pokus. 2. Naplánujte cestu a odhadněte čas. 3. Jděte se psem v tahu a průběžně se orientujte. 4. Na kontrole udělejte pauzu s vodou. 5. Úspěšný pokus: kontrolu najdete, aniž byste zabloudili o víc než 500 m.",
                en: "1. A helper (or you) marks checkpoints on the map, such as a signpost, summit or spring; each checkpoint is one attempt. 2. Plan the route and estimate the time. 3. Walk with the dog pulling and keep track of your position. 4. Take a water break at each checkpoint. 5. Successful attempt: you reach the checkpoint without going more than 500 m off course.",
              },
            },
            {
              name: {
                cs: "Noční úsek s čelovkou 3 km",
                en: "Night stretch with a headlamp, 3 km",
              },
              procedure: {
                cs: "1. Vyberte známou cestu a vyrazte za soumraku. 2. Psovi připněte světlo nebo reflexní prvek. 3. Ujděte s čelovkou 3 km a chvalte psa za klidnou chůzi v tahu. 4. Postupně zkoušejte i méně známé úseky. 5. Úspěšný pokus: pes jde celé 3 km klidně před vámi, nelekne se tmy ani zvuků a nezastavuje se.",
                en: "1. Choose a familiar path and set off at dusk. 2. Fit the dog with a light or reflective gear. 3. Walk 3 km by headlamp and praise calm pulling. 4. Gradually try less familiar stretches. 5. Successful attempt: the dog walks calmly ahead for the full 3 km without spooking at the dark or noises, and without stopping.",
              },
            },
          ],
        },
      ],
    },
  ],
};
