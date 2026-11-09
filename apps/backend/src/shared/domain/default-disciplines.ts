import type { Prisma } from "@/generated/prisma/client";

// The disciplines every handler's library starts with (#72): goals and
// exercises included, based on AKC Canine Good Citizen and common training
// practice. They are ordinary library disciplines from then on: the handler
// edits or deletes them, and the tour offers whatever the library holds.
export const DEFAULT_DISCIPLINE_LANGUAGES = ["cs", "en"] as const;
export type DefaultDisciplineLanguage =
  (typeof DEFAULT_DISCIPLINE_LANGUAGES)[number];

type Text = Record<DefaultDisciplineLanguage, string>;
type Item = { name: Text };
type DefaultGoal = Item & { exercises: Item[] };
export type DefaultDiscipline = Item & { key: string; goals: DefaultGoal[] };

const item = (cs: string, en: string): Item => ({ name: { cs, en } });
const goal = (cs: string, en: string, exercises: Item[]): DefaultGoal => ({
  ...item(cs, en),
  exercises,
});

export const DEFAULT_DISCIPLINES: DefaultDiscipline[] = [
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

/** Adds the default disciplines to a new handler's library (run it in a transaction). */
export async function createDefaultDisciplines(
  db: Pick<Prisma.TransactionClient, "discipline">,
  userId: string,
  language: DefaultDisciplineLanguage,
) {
  await Promise.all(
    DEFAULT_DISCIPLINES.map((discipline) =>
      db.discipline.create({
        data: {
          userId,
          name: discipline.name[language],
          goals: {
            create: discipline.goals.map((goal) => ({
              name: goal.name[language],
              exercises: {
                create: goal.exercises.map((exercise, position) => ({
                  name: exercise.name[language],
                  position,
                })),
              },
            })),
          },
        },
      }),
    ),
  );
}

/**
 * The language a handler signed up in: the frontend passes its `lng` along in
 * the callback URL (as for emails). Anything else gets Czech, the default.
 */
export function signUpLanguage(
  callbackURL: unknown,
): DefaultDisciplineLanguage {
  if (typeof callbackURL !== "string") return "cs";
  try {
    const url = new URL(callbackURL, "http://localhost");
    return url.searchParams.get("lng") === "en" ? "en" : "cs";
  } catch {
    return "cs";
  }
}
