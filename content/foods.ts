import type { Food } from "@/content/types";

const TOXIC_ACTION =
  "Call your vet or a pet poison hotline right away, even if your pet seems fine. Do not make your pet vomit unless a professional tells you to.";

export const foods: Food[] = [
  {
    slug: "chocolate",
    name: "Chocolate",
    category: "snack",
    dog: "toxic",
    cat: "toxic",
    popular: true,
    summary:
      "Chocolate contains theobromine and caffeine, which pets cannot process well. Dark chocolate and baking chocolate are the most dangerous.",
    details: [
      "Toxicity depends on the type of chocolate, how much was eaten, and your pet's size. Small pets are at higher risk.",
      "Even a small amount can cause problems, so treat any chocolate eaten as worth a call to your vet.",
    ],
    warningSigns: [
      "Vomiting or diarrhea",
      "Restlessness or a racing heartbeat",
      "Tremors or seizures",
    ],
    whatToDo: TOXIC_ACTION,
  },
  {
    slug: "grapes-and-raisins",
    name: "Grapes and raisins",
    category: "fruit",
    dog: "toxic",
    cat: "caution",
    popular: true,
    summary:
      "Grapes and raisins can cause sudden kidney failure in dogs. The toxic substance is not known, and even small amounts have caused harm.",
    details: [
      "There is no safe amount to rely on. Some dogs react to a few grapes, others do not, and you cannot tell in advance.",
      "Cats are less studied, so the safest choice is to keep grapes away from them too.",
    ],
    warningSigns: [
      "Vomiting within hours",
      "Tiredness and less appetite",
      "Drinking or urinating much more or much less",
    ],
    whatToDo: TOXIC_ACTION,
  },
  {
    slug: "xylitol-gum",
    name: "Xylitol (sugar-free gum)",
    category: "snack",
    dog: "toxic",
    cat: "caution",
    popular: true,
    summary:
      "Xylitol is a sweetener in sugar-free gum, mints, baked goods and some peanut butters. In dogs it can cause a dangerous drop in blood sugar and liver damage.",
    details: [
      "Check labels. Xylitol may be listed as birch sugar.",
      "Cats seem less sensitive, but treat any exposure as a reason to call your vet.",
    ],
    warningSigns: ["Vomiting", "Weakness or stumbling", "Seizures"],
    whatToDo: TOXIC_ACTION,
  },
  {
    slug: "onions",
    name: "Onions",
    category: "vegetable",
    dog: "toxic",
    cat: "toxic",
    summary:
      "Onions, raw or cooked, damage red blood cells and can cause anemia in dogs and cats.",
    details: [
      "Onion powder and onion in sauces and soups count too.",
      "Signs can show up a few days after eating, not right away.",
    ],
    warningSigns: ["Pale gums", "Weakness", "Dark urine", "Vomiting"],
    whatToDo: TOXIC_ACTION,
  },
  {
    slug: "garlic",
    name: "Garlic",
    category: "vegetable",
    dog: "toxic",
    cat: "toxic",
    summary:
      "Garlic is related to onions and is more potent. It can damage red blood cells in both dogs and cats.",
    details: [
      "Garlic powder and seasoned leftovers count.",
      "Cats are especially sensitive to the onion family.",
    ],
    warningSigns: ["Pale gums", "Weakness", "Vomiting", "Less appetite"],
    whatToDo: TOXIC_ACTION,
  },
  {
    slug: "macadamia-nuts",
    name: "Macadamia nuts",
    category: "snack",
    dog: "toxic",
    cat: "caution",
    summary:
      "Macadamia nuts can make dogs weak and wobbly, and cause vomiting and tremors. The cause is unknown.",
    details: [
      "Cookies and snacks with macadamia count.",
      "Cats are less studied. Keep nuts away from them too.",
    ],
    warningSigns: ["Weak back legs", "Vomiting", "Tremors", "Fever"],
    whatToDo: TOXIC_ACTION,
  },
  {
    slug: "alcohol",
    name: "Alcohol",
    category: "other",
    dog: "toxic",
    cat: "toxic",
    summary:
      "Pets are much more sensitive to alcohol than people. Small amounts can cause dangerous drops in blood sugar, body temperature and breathing.",
    details: [
      "This includes drinks, raw yeast dough, and some food and cosmetics that contain alcohol.",
    ],
    warningSigns: [
      "Stumbling or drowsiness",
      "Slow breathing",
      "Vomiting",
      "Collapse",
    ],
    whatToDo: TOXIC_ACTION,
  },
  {
    slug: "coffee",
    name: "Coffee and caffeine",
    category: "other",
    dog: "toxic",
    cat: "toxic",
    summary:
      "Coffee grounds, tea bags, energy drinks and caffeine pills contain caffeine, which overstimulates a pet's heart and nervous system.",
    details: [
      "Used grounds and beans are more concentrated than a cup of coffee.",
    ],
    warningSigns: [
      "Restlessness",
      "Fast heartbeat",
      "Panting",
      "Tremors or seizures",
    ],
    whatToDo: TOXIC_ACTION,
  },
  {
    slug: "avocado",
    name: "Avocado",
    category: "fruit",
    dog: "caution",
    cat: "caution",
    summary:
      "The flesh is fatty and can upset a stomach. The pit is a choking and blockage risk, and the skin and leaves hold a substance called persin.",
    details: [
      "Dogs and cats are less sensitive to persin than some other animals, but the fat and the pit are still a problem.",
      "A lick of guacamole is a different risk: it often contains onion or garlic.",
    ],
    warningSigns: ["Vomiting", "Diarrhea", "Belly pain"],
    whatToDo:
      "Skip it. If your pet ate the pit or has repeated vomiting, call your vet.",
  },
  {
    slug: "cooked-bones",
    name: "Cooked bones",
    category: "protein",
    dog: "caution",
    cat: "caution",
    summary:
      "Cooked bones can splinter, cut the mouth and gut, or cause a blockage.",
    details: [
      "Poultry and rib bones are the most likely to splinter.",
      "If you want to give a chew, ask your vet which ones suit your pet.",
    ],
    warningSigns: [
      "Gagging or drooling",
      "Vomiting",
      "Straining to poop",
      "Blood in stool",
    ],
    whatToDo:
      "Call your vet if your pet swallowed a bone, especially if they gag, vomit, or seem to be in pain.",
  },
  {
    slug: "apples",
    name: "Apples",
    category: "fruit",
    dog: "safe",
    cat: "safe",
    popular: true,
    summary:
      "Plain apple slices are a crunchy treat for dogs. Cats can have a small piece, but most are not interested.",
    details: ["Remove the core and seeds first. Seeds contain a little cyanide and the core can be a choking risk."],
    servingTips: [
      "Cut into bite-size slices",
      "Offer a few pieces at a time",
    ],
    whatToDo:
      "Treats should stay under about 10% of daily calories. Call your vet if your pet has a stomach upset that does not pass.",
  },
  {
    slug: "blueberries",
    name: "Blueberries",
    category: "fruit",
    dog: "safe",
    cat: "safe",
    popular: true,
    summary:
      "Blueberries are a low-calorie treat for dogs and cats when fed plain.",
    details: ["Small dogs and cats should have only a few at a time."],
    servingTips: ["Fresh or frozen, with no sugar or sauce"],
    whatToDo:
      "Feed in small amounts. Too many can cause loose stool.",
  },
  {
    slug: "carrots",
    name: "Carrots",
    category: "vegetable",
    dog: "safe",
    cat: "safe",
    summary:
      "Carrots are a crunchy, low-calorie snack for dogs. Cooked, soft carrot can be offered to cats in tiny amounts.",
    details: ["Cut raw carrots into small pieces so they are not a choking risk."],
    servingTips: ["Plain, with no butter or seasoning"],
    whatToDo:
      "Feed as an occasional treat. Call your vet if your pet vomits or has diarrhea afterward.",
  },
  {
    slug: "plain-cooked-chicken",
    name: "Plain cooked chicken",
    category: "protein",
    dog: "safe",
    cat: "safe",
    popular: true,
    summary:
      "Plain, boneless, skinless chicken is a lean protein both dogs and cats can eat.",
    details: [
      "Do not use seasoning, onion, garlic or sauces.",
      "It is a treat, not a complete diet.",
    ],
    servingTips: ["Boiled or baked, with all bones removed", "Cool before serving"],
    whatToDo:
      "Feed small portions. Check with your vet before changing the main diet.",
  },
  {
    slug: "white-rice",
    name: "White rice",
    category: "other",
    dog: "safe",
    cat: "safe",
    summary:
      "Plain cooked white rice is bland and gentle. Vets often suggest it with chicken for mild stomach upset.",
    details: ["It is not a cure. Ongoing stomach trouble needs a vet visit."],
    servingTips: ["Cooked plain, with no salt, butter or oil"],
    whatToDo:
      "If vomiting or diarrhea lasts more than a day, or your pet seems unwell, see a vet.",
  },
  {
    slug: "peanut-butter",
    name: "Peanut butter",
    category: "snack",
    dog: "safe",
    cat: "caution",
    popular: true,
    summary:
      "Dogs can lick plain peanut butter, but only if it has no xylitol. Cats do not need it and it is fatty.",
    details: [
      "Always read the label for xylitol (also called birch sugar).",
      "It is high in fat and calories, so keep the portion small.",
    ],
    servingTips: ["Unsalted, unsweetened, with no xylitol"],
    whatToDo:
      "If the label lists xylitol and your pet ate some, treat it as an emergency and call your vet now.",
  },
  {
    slug: "cheese",
    name: "Cheese",
    category: "dairy",
    dog: "caution",
    cat: "caution",
    summary:
      "Many dogs and cats are lactose intolerant. A tiny bite is usually fine, but cheese is fatty and can upset a stomach.",
    details: ["Avoid blue cheese, and cheese with herbs, garlic or onion."],
    warningSigns: ["Gas", "Loose stool", "Vomiting"],
    whatToDo:
      "Keep it to a small piece now and then. Pets prone to pancreatitis should skip it.",
  },
  {
    slug: "milk",
    name: "Milk",
    category: "dairy",
    dog: "caution",
    cat: "caution",
    summary:
      "Adult cats and dogs often cannot digest lactose well, so cow's milk can cause diarrhea and gas.",
    details: ["Water is the best drink. Lactose-free pet milk is an option as a rare treat."],
    warningSigns: ["Diarrhea", "Bloating", "Vomiting"],
    whatToDo:
      "Do not give milk as a drink. If your pet has ongoing diarrhea, see your vet.",
  },
  {
    slug: "watermelon",
    name: "Watermelon",
    category: "fruit",
    dog: "safe",
    cat: "safe",
    summary:
      "Seedless watermelon flesh is a hydrating treat in hot weather.",
    details: ["Remove seeds and rind. They can cause blockages."],
    servingTips: ["Small chunks, chilled"],
    whatToDo:
      "Feed a few pieces. Too much can cause loose stool.",
  },
  {
    slug: "pumpkin",
    name: "Pumpkin",
    category: "vegetable",
    dog: "safe",
    cat: "safe",
    summary:
      "Plain cooked or canned pumpkin has fiber and is sometimes used to help mild constipation or loose stool.",
    details: [
      "Use plain pumpkin, not pumpkin pie filling, which has sugar and spices.",
      "Check with your vet if you plan to use it regularly.",
    ],
    servingTips: ["One teaspoon for small pets, a tablespoon for large dogs"],
    whatToDo:
      "If constipation or diarrhea lasts more than a day or two, see a vet.",
  },
];
