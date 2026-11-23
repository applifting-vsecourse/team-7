// Generated from the F-63 content (agility-sports.json) by to-ts.mjs; edit the JSON and regenerate.
// Sources:
// - https://www.fci.be/medias/AGI-REG-en-23672.pdf
// - https://www.fci.be/medias/HOO-REG-en-22638.pdf
// - https://www.fci.be/EN/Hoopers-6914.html
// - https://www.akc.org/expert-advice/sports/prepare-puppy-agility-training/
// - https://www.akc.org/expert-advice/training/practice-agility-at-home/
// - https://susangarrettdogagility.com/2026/01/agility-with-a-puppy/
// - https://www.oneminddogs.com/blog/when-can-puppy-start-agility
// - https://dogagility.org.nz/hoopers.html
// - https://www.akc.org/expert-advice/sports/disc-dog-101-whats-updog-challenge/
// - https://hyperflite.com/jumping-jehosaphats-teaching-a-dog-to-jump-for-a-flying-disc/
// - https://loype.cz/blog/try-a-new-discipline-how-to-start-with-dogfrisbee
import type { CatalogCategory } from "./types";

export const agilitySports: CatalogCategory = {
  key: "agility-sports",
  name: {
    cs: "Obratnost a akční sporty",
    en: "Agility & action sports",
  },
  description: {
    cs: "Rychlé sporty, ve kterých pes běhá, mění směr a spolupracuje s psovodem v pohybu: agility, hoopers a dogfrisbee. Začněte základy bez plných výšek a skoků a zátěž přidávejte až u dospělého, zdravého psa.",
    en: "Fast sports where the dog runs, turns and works with the handler on the move: agility, hoopers and disc dog. Start with foundations, without full-height jumps, and add load only once the dog is adult and healthy.",
  },
  disciplines: [
    {
      key: "agility",
      shortName: {
        cs: "Agility",
        en: "Agility",
      },
      name: {
        cs: "Agility – základy",
        en: "Agility – basics",
      },
      description: {
        cs: "Pes probíhá parkur ze skoků, tunelů a slalomu a psovod ho vede tělem a povely.",
        en: "The dog runs a course of jumps, tunnels and weaves, guided by your body and cues.",
      },
      goals: [
        {
          name: {
            cs: "Start a ovládání těla",
            en: "Start line and body awareness",
          },
          criterion: {
            cs: "Pes zvládne na cvičišti odložení na startu i obíhání kužele v 8 z 10 pokusů ve 3 trénincích po sobě.",
            en: "The dog completes the start-line stay and the cone wrap at the training ground in 8 of 10 attempts in 3 sessions in a row.",
          },
          exercises: [
            {
              name: {
                cs: "Odložení na startu – odchod na 3 m",
                en: "Start-line stay – 3 m lead-out",
              },
              procedure: {
                cs: "1. Posaďte nebo položte psa a řekněte „Zůstaň“. 2. Odstupte o krok, vraťte se a odměňte ho v poloze. 3. Postupně se vzdalujte až na 3 m a pak psa uvolněte uvolňovacím povelem (např. „Jdi“). 4. Úspěšný pokus: pes zůstane na místě, dokud ho neuvolníte.",
                en: "1. Ask for a sit or down and cue “Stay”. 2. Take one step away, return and reward in position. 3. Build up to 3 m away, then release with your release cue (e.g. “Go”). 4. Successful attempt: the dog holds position until released.",
              },
            },
            {
              name: {
                cs: "Obíhání kužele vpravo i vlevo",
                en: "Wrap a cone, left and right",
              },
              procedure: {
                cs: "1. Postavte kužel nebo kbelík metr od sebe. 2. Odměňte každý pohyb psa směrem ke kuželi, později až celé oběhnutí. 3. Pro každý směr přidejte vlastní povel (např. „Kolem“ / „Otoč“) a každou stranu trénujte zvlášť. 4. Úspěšný pokus: pes oběhne kužel na zvolenou stranu a vrátí se k vám.",
                en: "1. Place a cone or bucket 1 m from you. 2. Reward any move towards the cone, later only a full wrap. 3. Add a cue for each direction (e.g. “Around” / “Switch”) and train each side separately. 4. Successful attempt: the dog wraps the cone in the cued direction and comes back to you.",
              },
            },
            {
              name: {
                cs: "Target 2on2off na nízké desce",
                en: "2on2off target on a low plank",
              },
              procedure: {
                cs: "1. Položte desku na zem a na její konec dejte target (víčko, podložku). 2. Odměňte psa, když stojí předníma nohama na zemi u targetu a zadníma na desce. 3. Přidejte povel a pak pohyb: pes do pozice dojde po desce sám. 4. Úspěšný pokus: pes zastaví v pozici 2on2off a vydrží v ní, dokud ho neuvolníte.",
                en: "1. Lay a plank on the ground with a target (lid, mat) at the end. 2. Reward the dog for front feet on the ground at the target and back feet on the plank. 3. Add a cue, then movement: the dog walks along the plank into position on their own. 4. Successful attempt: the dog stops in 2on2off and holds it until released.",
              },
            },
          ],
        },
        {
          name: {
            cs: "Tunel a nízké skoky",
            en: "Tunnel and low jumps",
          },
          criterion: {
            cs: "Pes proběhne sekvenci tunel + skok správně při vedení zleva i zprava v 8 z 10 pokusů ve 3 trénincích po sobě.",
            en: "The dog runs the tunnel + jump sequence correctly, handled on both your left and your right, in 8 of 10 attempts in 3 sessions in a row.",
          },
          exercises: [
            {
              name: {
                cs: "Krátký rovný tunel",
                en: "Short straight tunnel",
              },
              procedure: {
                cs: "1. Stáhněte tunel na 1–2 m, aby pes viděl skrz. 2. Pomocník drží psa u vstupu, vy ho voláte z druhé strany a odměníte na výstupu. 3. Tunel postupně natahujte a přidejte povel „Tunel“; psa do tunelu nikdy netlačte. 4. Úspěšný pokus: pes proběhne tunelem bez zastavení.",
                en: "1. Bunch the tunnel up to 1–2 m so the dog can see through. 2. A helper holds the dog at the entry; you call from the exit and reward there. 3. Lengthen the tunnel step by step and add the cue “Tunnel”; never push the dog in. 4. Successful attempt: the dog runs through without stopping.",
              },
            },
            {
              name: {
                cs: "Skok s laťkou ve výšce hlezna",
                en: "Hock-height jump",
              },
              procedure: {
                cs: "1. Položte laťku na zem nebo nízko do držáků, nejvýš do výšky hlezna, na neklouzavém povrchu. 2. Veďte psa přes laťku, odměňte ho za ní a střídejte stranu vedení. 3. Přidejte povel „Hop“; výšku nezvyšujte, dokud pes nedospěje. 4. Úspěšný pokus: pes přeběhne laťku v plném kroku a neshodí ji.",
                en: "1. Set the bar on the ground or in low cups, at most at hock height, on a non-slip surface. 2. Lead the dog over, reward beyond the bar and switch sides. 3. Add the cue “Jump”; don't raise the bar before the dog is mature. 4. Successful attempt: the dog clears the bar in stride without knocking it.",
              },
            },
            {
              name: {
                cs: "Sekvence tunel + skok",
                en: "Tunnel + jump sequence",
              },
              procedure: {
                cs: "1. Postavte tunel a 4–5 m za něj v přímce nízký skok. 2. Pošlete psa do tunelu, na výstupu ho veďte na skok a odměnu hoďte za skok. 3. Trénujte s vedením vlevo i vpravo. 4. Úspěšný pokus: pes překoná obě překážky ve správném pořadí, neodbočí a neshodí laťku.",
                en: "1. Set up a tunnel with a low jump 4–5 m beyond it, in a straight line. 2. Send the dog into the tunnel, drive on to the jump and throw the reward past the jump. 3. Train with the dog on your left and on your right. 4. Successful attempt: the dog takes both obstacles in order without veering off or knocking the bar.",
              },
            },
          ],
        },
        {
          name: {
            cs: "Slalom a krátké sekvence",
            en: "Weave entries and short sequences",
          },
          criterion: {
            cs: "Pes správně vstoupí do otevřeného kanálu 6 tyčí a proběhne sekvenci 3 překážek v 8 z 10 pokusů ve 3 trénincích po sobě. Slalom zavírejte až u dospělého psa (asi 14–16 měsíců).",
            en: "The dog enters an open 6-pole channel correctly and runs a 3-obstacle sequence in 8 of 10 attempts in 3 sessions in a row. Close the weaves only once the dog is mature (about 14–16 months).",
          },
          exercises: [
            {
              name: {
                cs: "Vstup do kanálu ze 2 tyčí",
                en: "Two-pole channel entry",
              },
              procedure: {
                cs: "1. Zapíchněte 2 tyče rozestoupené do stran tak, aby pes mohl proběhnout rovně mezi nimi. 2. Pes musí vstoupit tak, aby měl první tyč po levém boku. 3. Odměnu dávejte za druhou tyčí, později ji házejte vpřed. 4. Úspěšný pokus: pes vstoupí správně, i když přibíhá ze strany.",
                en: "1. Set 2 poles spread apart so the dog can run straight between them. 2. The dog must enter with the first pole at their left shoulder. 3. Reward past the second pole, later throw the reward ahead. 4. Successful attempt: the dog enters correctly, including when approaching from an angle.",
              },
            },
            {
              name: {
                cs: "Otevřený kanál 6 tyčí",
                en: "Open 6-pole channel",
              },
              procedure: {
                cs: "1. Postavte 6 tyčí jako široký kanál (dvě řady, pes běží rovně uprostřed). 2. Pošlete psa správným vstupem a odměňte ho na konci. 3. Kanál zužujte jen nepatrně a jen u dospělého psa. 4. Úspěšný pokus: pes vstoupí správně a proběhne kanálem až na konec bez vybočení.",
                en: "1. Set 6 poles as a wide channel (two rows, the dog runs straight down the middle). 2. Send the dog with a correct entry and reward at the end. 3. Narrow the channel only slightly, and only with an adult dog. 4. Successful attempt: the dog enters correctly and runs to the end without popping out.",
              },
            },
            {
              name: {
                cs: "Sekvence skok – tunel – skok se změnou strany",
                en: "Jump – tunnel – jump with a side change",
              },
              procedure: {
                cs: "1. Postavte nízký skok, tunel a druhý nízký skok do mírného oblouku. 2. Zatímco je pes v tunelu, přejděte před ním na druhou stranu (změna před psem). 3. Pes vybíhá z tunelu k vám a na druhý skok. 4. Úspěšný pokus: pes překoná všechny 3 překážky ve správném pořadí a bez odmítnutí.",
                en: "1. Set a low jump, a tunnel and a second low jump in a gentle curve. 2. While the dog is in the tunnel, cross in front to the other side (front cross). 3. The dog exits towards you and takes the second jump. 4. Successful attempt: the dog takes all 3 obstacles in order without a refusal.",
              },
            },
          ],
        },
      ],
    },
    {
      key: "hoopers",
      shortName: {
        cs: "Hoopers",
        en: "Hoopers",
      },
      name: {
        cs: "Hoopers – vedení na dálku",
        en: "Hoopers – distance handling",
      },
      description: {
        cs: "Pes probíhá trať z obručí, barelů a tunelů a psovod ho vede z jednoho místa hlasem a tělem.",
        en: "The dog runs hoops, barrels and tunnels while you guide them from one spot by voice and body.",
      },
      goals: [
        {
          name: {
            cs: "Obruče a odměna vpředu",
            en: "Hoops and a reward ahead",
          },
          criterion: {
            cs: "Pes proběhne na povel řadu 3 obručí a sám doběhne k odměně vpředu v 8 z 10 pokusů ve 3 trénincích po sobě.",
            en: "The dog runs a line of 3 hoops on cue and goes on to the reward ahead by themselves in 8 of 10 attempts in 3 sessions in a row.",
          },
          exercises: [
            {
              name: {
                cs: "Průběh obručí tam a zpět",
                en: "Back and forth through a hoop",
              },
              procedure: {
                cs: "1. Postavte obruč a hoďte pamlsek na jednu stranu tak, aby jí pes prošel. 2. Jakmile ho sní, hoďte další na druhou stranu. 3. Přidejte povel „Obruč“ a odměnu postupně házejte dál za obruč. 4. Úspěšný pokus: pes projde obručí celým tělem, ne kolem ní.",
                en: "1. Set up a hoop and toss a treat to one side so the dog passes through. 2. Once they've eaten it, toss the next one to the other side. 3. Add the cue “Hoop” and gradually toss rewards further past the hoop. 4. Successful attempt: the dog passes completely through the hoop, not around it.",
              },
            },
            {
              name: {
                cs: "Řada 3 obručí s miskou vpředu",
                en: "Line of 3 hoops to a target bowl",
              },
              procedure: {
                cs: "1. Postavte 3 obruče do přímky po 3–5 m a za poslední položte misku s pamlskem nebo hračku. 2. Běžte se psem podél obručí a pošlete ho povelem. 3. Postupně zpomalujte a zůstávejte víc vzadu. 4. Úspěšný pokus: pes proběhne všemi 3 obručemi a doběhne k misce.",
                en: "1. Set 3 hoops in a line, 3–5 m apart, with a bowl holding a treat, or a toy, past the last one. 2. Run alongside and send the dog on cue. 3. Gradually slow down and stay further back. 4. Successful attempt: the dog runs through all 3 hoops and on to the bowl.",
              },
            },
            {
              name: {
                cs: "Poslání do obruče ze 3 m",
                en: "Send to a hoop from 3 m",
              },
              procedure: {
                cs: "1. Stoupněte si 1 m od obruče a pošlete psa povelem „Obruč“ a gestem ruky. 2. Odměnu hoďte za obruč, nebo ji mějte připravenou v misce. 3. Vzdálenost prodlužujte po krocích až na 3 m. 4. Úspěšný pokus: pes sám vyběhne k obruči a projde jí, zatímco vy stojíte na místě.",
                en: "1. Stand 1 m from the hoop and send the dog with “Hoop” and an arm signal. 2. Throw the reward past the hoop or have it waiting in a bowl. 3. Increase the distance step by step up to 3 m. 4. Successful attempt: the dog leaves you, goes to the hoop and through it while you stand still.",
              },
            },
          ],
        },
        {
          name: {
            cs: "Barel, branka a tunel",
            en: "Barrel, gate and tunnel",
          },
          criterion: {
            cs: "Pes ze vzdálenosti aspoň 2 m oběhne barel na zvolenou stranu a proběhne tunel na povel v 8 z 10 pokusů ve 3 trénincích po sobě.",
            en: "From at least 2 m away, the dog goes around the barrel on the cued side and through the tunnel on cue in 8 of 10 attempts in 3 sessions in a row.",
          },
          exercises: [
            {
              name: {
                cs: "Obíhání barelu vpravo / vlevo",
                en: "Barrel wrap, left / right",
              },
              procedure: {
                cs: "1. Stoupněte si těsně k barelu a pamlskem v ruce veďte psa kolem něj. 2. Každému směru dejte vlastní povel (např. „Vpravo“ / „Vlevo“). 3. Od barelu postupně odstupujte až na 2 m. 4. Úspěšný pokus: pes oběhne barel na zvolenou stranu a vrátí se směrem k vám.",
                en: "1. Stand right next to the barrel and lure the dog around it. 2. Give each direction its own cue (e.g. “Right” / “Left”). 3. Gradually step back from the barrel, up to 2 m. 4. Successful attempt: the dog goes around the barrel on the cued side and comes back towards you.",
              },
            },
            {
              name: {
                cs: "Obcházení branky",
                en: "Going around a gate",
              },
              procedure: {
                cs: "1. Postavte branku (např. síťovou zábranu) a hoďte pamlsek tak, aby ji pes musel obejít. 2. Veďte psa kolem branky ze stejné strany a odměňte ho za ní. 3. Přidejte povel a odstupujte. 4. Úspěšný pokus: pes obejde branku zvoleným směrem a neproběhne kolem jejího krátkého boku.",
                en: "1. Set up a gate (e.g. a mesh panel) and toss a treat so the dog has to go around it. 2. Lead the dog around from the same side and reward beyond it. 3. Add a cue and step back. 4. Successful attempt: the dog goes around the gate in the cued direction, not past its narrow end.",
              },
            },
            {
              name: {
                cs: "Poslání do tunelu ze 2 m",
                en: "Send to a tunnel from 2 m",
              },
              procedure: {
                cs: "1. Začněte s krátkým tunelem a odměnou připravenou na výstupu. 2. Pošlete psa povelem „Tunel“ zblízka. 3. Od vstupu postupně odstupujte až na 2 m. 4. Úspěšný pokus: pes sám vběhne do tunelu a proběhne ho bez zastavení, zatímco vy se nehnete z místa.",
                en: "1. Start with a short tunnel and a reward waiting at the exit. 2. Send the dog with “Tunnel” from close up. 3. Gradually move away from the entry, up to 2 m. 4. Successful attempt: the dog goes in by themselves and runs through without stopping, while you stay put.",
              },
            },
          ],
        },
        {
          name: {
            cs: "Vedení z prostoru psovoda",
            en: "Handling from the handling area",
          },
          criterion: {
            cs: "Pes proběhne trať 8 překážek čistě (bez vynechané překážky a bez opravy) a psovod nevystoupí z prostoru 2 × 2 m, ve 4 z 5 pokusů ve 2 trénincích po sobě.",
            en: "The dog runs an 8-obstacle course clear (no skipped obstacles, no corrections) and you never leave the 2 × 2 m handling area, in 4 of 5 attempts in 2 sessions in a row.",
          },
          exercises: [
            {
              name: {
                cs: "Sekvence 3 překážek z prostoru psovoda",
                en: "3-obstacle sequence from the handling area",
              },
              procedure: {
                cs: "1. Vyznačte čtverec 2 × 2 m (lanem, páskou). 2. Postavte obruč – barel – obruč 4–5 m od čtverce. 3. Nechte psa čekat před první obručí, dojděte do čtverce a pošlete ho. 4. Úspěšný pokus: pes projde všechny 3 překážky ve správném pořadí a vy celou dobu stojíte ve čtverci.",
                en: "1. Mark out a 2 × 2 m square (rope, tape). 2. Set up hoop – barrel – hoop 4–5 m from the square. 3. Leave the dog waiting at the first hoop, walk to the square and send them. 4. Successful attempt: the dog takes all 3 obstacles in order while you stay inside the square.",
              },
            },
            {
              name: {
                cs: "Změna směru na povel na 5 m",
                en: "Verbal direction change at 5 m",
              },
              procedure: {
                cs: "1. Postavte obruč a za ni dvě další, jednu vpravo a druhou vlevo, 5 m od vás. 2. Po první obruči dejte povel „Vpravo“ nebo „Vlevo“ a tělem pomáhejte co nejméně. 3. Směry střídejte náhodně. 4. Úspěšný pokus: pes po první obruči zvolí obruč podle povelu.",
                en: "1. Set one hoop with two more beyond it, one to the right and one to the left, 5 m from you. 2. After the first hoop, cue “Right” or “Left” with as little body help as possible. 3. Mix the directions at random. 4. Successful attempt: after the first hoop the dog picks the hoop that matches the cue.",
              },
            },
            {
              name: {
                cs: "Trať 8 překážek z prostoru psovoda",
                en: "8-obstacle course from the handling area",
              },
              procedure: {
                cs: "1. Postavte trať, která začíná i končí obručí; aspoň polovina překážek jsou obruče, rozestupy 5–8 m. 2. Nejvzdálenější překážka ať je do 10 m od čtverce. 3. Odměňujte až po poslední obruči. 4. Úspěšný pokus: pes proběhne celou trať ve správném pořadí a vy nevystoupíte ze čtverce.",
                en: "1. Build a course that starts and ends with a hoop, with at least half the obstacles being hoops, 5–8 m apart. 2. Keep the furthest obstacle within 10 m of the square. 3. Reward only after the last hoop. 4. Successful attempt: the dog runs the whole course in order and you never step out of the square.",
              },
            },
          ],
        },
      ],
    },
    {
      key: "disc-dog",
      shortName: {
        cs: "Dogfrisbee",
        en: "Disc dog",
      },
      name: {
        cs: "Dogfrisbee – hod a aport",
        en: "Disc dog – toss and fetch",
      },
      description: {
        cs: "Psovod hází disk, pes ho chytá a přináší zpět.",
        en: "You throw a disc, and your dog catches it and brings it back.",
      },
      goals: [
        {
          name: {
            cs: "Zájem o disk a pouštění",
            en: "Disc drive and release",
          },
          criterion: {
            cs: "Pes pustí disk na povel a honí kutálený disk v 8 z 10 pokusů ve 3 trénincích po sobě.",
            en: "The dog releases the disc on cue and chases a rolled disc in 8 of 10 attempts in 3 sessions in a row.",
          },
          exercises: [
            {
              name: {
                cs: "Přetahování a pouštění",
                en: "Tug and drop",
              },
              procedure: {
                cs: "1. Krátce se se psem přetahujte o disk. 2. Zastavte pohyb, držte disk v klidu a řekněte „Pusť“. 3. Jakmile pes pustí, hned hru obnovte nebo mu nabídněte druhý disk. 4. Úspěšný pokus: pes pustí disk do 3 s od povelu, aniž byste ho tahali nebo vytrhávali.",
                en: "1. Play a short game of tug with the disc. 2. Freeze, hold the disc still and say “Drop”. 3. As soon as the dog lets go, restart the game or offer a second disc. 4. Successful attempt: the dog releases within 3 s of the cue, without you pulling the disc out.",
              },
            },
            {
              name: {
                cs: "Honění kutáleného disku (roller)",
                en: "Chase a rolling disc (roller)",
              },
              procedure: {
                cs: "1. Kutálejte disk po hraně po trávě na 3–5 m. 2. Povzbuďte psa, ať ho honí, a pochvalte ho, když ho chytí. 3. Vzdálenost prodlužujte až na 10 m. 4. Úspěšný pokus: pes disk dohoní a vezme do tlamy dřív, než se zastaví.",
                en: "1. Roll the disc on its edge across grass for 3–5 m. 2. Encourage the dog to chase it and praise the grab. 3. Build the distance up to 10 m. 4. Successful attempt: the dog catches up and picks up the disc before it stops rolling.",
              },
            },
            {
              name: {
                cs: "Výměna za druhý disk",
                en: "Two-disc trade",
              },
              procedure: {
                cs: "1. Mějte dva stejné disky. 2. Když pes nese disk, ukažte mu druhý a rozhýbejte ho. 3. Jakmile první pustí, hned mu hoďte nebo kutálejte druhý. 4. Úspěšný pokus: pes sám pustí disk u vás a vyběhne za druhým.",
                en: "1. Have two identical discs. 2. When the dog is carrying one, show them the other and wiggle it. 3. As soon as they drop the first, throw or roll the second. 4. Successful attempt: the dog drops the disc near you on their own and goes after the second one.",
              },
            },
          ],
        },
        {
          name: {
            cs: "Chytání krátkých hodů",
            en: "Catching short throws",
          },
          criterion: {
            cs: "Pes chytí nízký hod na 5 m ve vzduchu v 7 z 10 pokusů ve 3 trénincích po sobě.",
            en: "The dog catches a low 5 m throw in the air in 7 of 10 attempts in 3 sessions in a row.",
          },
          exercises: [
            {
              name: {
                cs: "Podání disku za běhu",
                en: "Hand-off on the move",
              },
              procedure: {
                cs: "1. Popoběhněte se psem a držte disk vodorovně ve výšce jeho tlamy. 2. Nechte psa vzít si disk z ruky v běhu. 3. Pak disk pusťte těsně před ním, aby ho chytil po pár centimetrech letu. 4. Úspěšný pokus: pes disk čistě chytí do tlamy, aniž by vyskočil.",
                en: "1. Jog with the dog and hold the disc flat at the height of their mouth. 2. Let the dog take it from your hand on the move. 3. Then let go just in front of the dog so they catch it after a short glide. 4. Successful attempt: the dog catches the disc cleanly without jumping.",
              },
            },
            {
              name: {
                cs: "Obíhání psovoda před hodem",
                en: "Around cue before the throw",
              },
              procedure: {
                cs: "1. Pamlskem nebo diskem veďte psa kolem sebe za zády. 2. Přidejte povel (např. „Kolem“) a ruku postupně vynechávejte. 3. Na konci oběhnutí kutálejte nebo hoďte disk ve směru jeho pohybu. 4. Úspěšný pokus: pes vás oběhne celým kruhem a vybíhá dopředu za hodem.",
                en: "1. Lure the dog around you, behind your back, with a treat or the disc. 2. Add a cue (e.g. “Around”) and fade the lure. 3. As the dog finishes the circle, roll or throw the disc in the direction they are moving. 4. Successful attempt: the dog circles you fully and runs out ahead for the throw.",
              },
            },
            {
              name: {
                cs: "Nízký backhand na 5 m",
                en: "Low backhand toss at 5 m",
              },
              procedure: {
                cs: "1. Hoďte disk backhandem naplocho a nízko, pod úroveň očí psa, na 3 m. 2. Házejte tak, aby pes nemusel skákat ani se prudce vytáčet; vlastní nepovedený hod nepočítejte jako pokus. 3. Vzdálenost prodlužte na 5 m. 4. Úspěšný pokus: pes chytí disk ve vzduchu dřív, než dopadne na zem.",
                en: "1. Throw a flat, low backhand, below the dog's eye level, to 3 m. 2. Place it so the dog doesn't need to jump or twist sharply; don't count your own bad throws as attempts. 3. Extend to 5 m. 4. Successful attempt: the dog catches the disc before it touches the ground.",
              },
            },
          ],
        },
        {
          name: {
            cs: "Toss and fetch – aport a delší hody",
            en: "Toss and fetch – returns and longer throws",
          },
          criterion: {
            cs: "Pes v 60s kole chytí aspoň 5 hodů na 10 m a více a pokaždé disk přinese až k psovodovi, ve 3 trénincích po sobě.",
            en: "In a 60-second round the dog catches at least 5 throws of 10 m or more and brings each disc back to you, in 3 sessions in a row.",
          },
          exercises: [
            {
              name: {
                cs: "Aport disku do ruky",
                en: "Return the disc to hand",
              },
              procedure: {
                cs: "1. Kutálejte nebo hoďte disk na 5 m. 2. Když ho pes chytí, couvejte od něj nebo ho zavolejte a chvalte ho, jak se blíží. 3. Disk vyměňte za druhý nebo za pamlsek. 4. Úspěšný pokus: pes donese disk až k vám (do 1 m) a pustí ho na povel.",
                en: "1. Roll or throw the disc 5 m. 2. When the dog grabs it, back away or call them and praise as they come in. 3. Trade it for the second disc or a treat. 4. Successful attempt: the dog brings the disc to within 1 m of you and drops it on cue.",
              },
            },
            {
              name: {
                cs: "Hod na 10–15 m s chytem",
                en: "10–15 m throw with a catch",
              },
              procedure: {
                cs: "1. Pošlete psa povelem dopředu nebo ho nechte oběhnout. 2. Hoďte plochý backhand v jeho směru tak, aby disk dobíhal, a ne na něj čekal. 3. Hod prodlužujte, jen dokud házíte přesně. 4. Úspěšný pokus: pes chytí disk ve vzduchu na 10 m a více.",
                en: "1. Send the dog out or use the around cue. 2. Throw a flat backhand along their line, so the dog runs onto the disc instead of waiting under it. 3. Lengthen the throw only while you stay accurate. 4. Successful attempt: the dog catches the disc in the air at 10 m or more.",
              },
            },
            {
              name: {
                cs: "60s kolo toss and fetch",
                en: "60-second toss and fetch round",
              },
              procedure: {
                cs: "1. Vyznačte čáru hodu a vzdálenosti po 10 m. 2. Spusťte stopky na 60 s a házejte jedním diskem; pes ho musí pokaždé přinést. 3. Každý hod je jeden pokus; mezi koly nechte psa vydýchat a dejte mu napít. 4. Úspěšný pokus: pes chytí disk ve vzduchu a přinese ho zpět.",
                en: "1. Mark a throwing line and distances every 10 m. 2. Set a 60-second timer and throw one disc; the dog must bring it back each time. 3. Each throw is one attempt; let the dog cool down and drink between rounds. 4. Successful attempt: the dog catches the disc in the air and brings it back.",
              },
            },
          ],
        },
      ],
    },
  ],
};
