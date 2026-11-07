// Prefilled disciplines offered by the first-login tour (#72, Figma "Spec ·
// Onboarding"). Based on AKC Canine Good Citizen and common training
// practice. Picking one copies it into the handler's library, so later edits
// never change the catalog.
export const CATALOG_LANGUAGES = ["cs", "en"] as const;
export type CatalogLanguage = (typeof CATALOG_LANGUAGES)[number];

type Text = Record<CatalogLanguage, string>;
type Item = { name: Text };
type CatalogGoal = Item & { exercises: Item[] };
export type CatalogDiscipline = Item & { key: string; goals: CatalogGoal[] };

const item = (cs: string, en: string): Item => ({ name: { cs, en } });
const goal = (cs: string, en: string, exercises: Item[]): CatalogGoal => ({
  ...item(cs, en),
  exercises,
});

export const DISCIPLINE_CATALOG: CatalogDiscipline[] = [
  {
    key: "obedience",
    ...item("Základy poslušnosti", "Obedience basics"),
    goals: [
      goal("Chůze na volném vodítku", "Loose-leash walking", [
        item("Pozornost na jméno", "Attention on name"),
        item(
          "Chůze u nohy 10 kroků bez tahu",
          "Heel for 10 steps without pulling",
        ),
        item("Změny směru", "Changes of direction"),
      ]),
      goal("Sedni, lehni, zůstaň", "Sit, down, stay", [
        item("Sedni na povel", "Sit on cue"),
        item("Lehni na povel", "Down on cue"),
        item("Zůstaň 30 s na 3 m", "Stay 30 s at 3 m"),
      ]),
      goal("Klidné setkání", "Calm greeting", [
        item(
          "Pozdrav s cizím člověkem bez skákání",
          "Greet a stranger without jumping",
        ),
        item("Míjení psa na vodítku", "Pass a dog on leash"),
      ]),
    ],
  },
  {
    key: "recall",
    ...item("Spolehlivé přivolání", "Reliable recall"),
    goals: [
      goal("Přivolání doma", "Recall at home", [
        item("Na jméno z vedlejší místnosti", "On name from the next room"),
        item("Z 5 m v klidu", "From 5 m, no distractions"),
      ]),
      goal("Venku na dlouhé lince", "Outdoors on a long line", [
        item("10 m lanko", "10 m line"),
        item("S hračkou na zemi", "With a toy on the ground"),
      ]),
      goal("S rozptýlením", "With distractions", [
        item("Od jiného psa", "Away from another dog"),
        item("Od hry", "Away from play"),
      ]),
    ],
  },
  {
    key: "nosework",
    ...item("Nosework – začátky", "Nosework – first steps"),
    goals: [
      goal("Hra s krabicemi", "Box game", [
        item("Pamlsek v 1 z 5 krabic", "Treat in 1 of 5 boxes"),
        item("Hledání ve 10 krabicích", "Search 10 boxes"),
      ]),
      goal("Zavedení pachu", "Odor introduction", [
        item("Pach + pamlsek v krabici", "Odor + treat in a box"),
        item("Pach v 1 z 5 krabic", "Odor in 1 of 5 boxes"),
      ]),
      goal("Hledání v místnosti", "Room search", [
        item("Pach v místnosti", "Odor in a room"),
        item("Pach ve výšce", "Odor at height"),
      ]),
    ],
  },
  {
    key: "agility",
    ...item("Agility – základy", "Agility – basics"),
    goals: [
      goal("Ovládání těla", "Body control", [
        item("Start se zůstaň", "Start-line stay"),
        item("Target 2on2off na zemi", "2on2off target on the ground"),
      ]),
      goal("Tunel a nízké skoky", "Tunnel and low jumps", [
        item("Rovný tunel", "Straight tunnel"),
        item("Skok v úrovni hlezna", "Hock-height jump"),
        item("Tunel + skok", "Tunnel + jump"),
      ]),
      goal("Slalom", "Weave poles", [
        item("Kanálová metoda 2 tyče", "Channel method, 2 poles"),
        item("6 tyčí rozestoupených", "6 open poles"),
      ]),
    ],
  },
  {
    key: "canicross",
    ...item("Canicross – začátky", "Canicross – first steps"),
    goals: [
      goal("Povely", "Cues", [
        item("Vpřed", "Forward"),
        item("Pomalu", "Easy"),
        item("Stůj", "Stop"),
        item("Vpravo", "Right"),
        item("Vlevo", "Left"),
      ]),
      goal("Tah v postroji", "Pulling in harness", [
        item("Tah v chůzi 5 min", "Pull at a walk for 5 min"),
      ]),
      goal("Kondice", "Conditioning", [
        item("Běh 1 min / chůze 2 min × 6", "Run 1 min / walk 2 min × 6"),
      ]),
    ],
  },
];
