export type SiteImage = {
  src: string;
  alt: string;
  credit: string;
};

const unsplash = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=75`;

const credit = "Photo via Unsplash";

export const images = {
  heroDog: {
    src: unsplash("1587300003388-59208cc962cb"),
    alt: "A happy border collie with its mouth open on a beach",
    credit,
  },
  heroCat: {
    src: unsplash("1514888286974-6c03e2ca1dba"),
    alt: "A black and white cat resting its paws on a wooden ledge",
    credit,
  },
  puppy: {
    src: unsplash("1576201836106-db1758fd1c97"),
    alt: "A golden puppy walking across a grassy yard",
    credit,
  },
  tabby: {
    src: unsplash("1518791841217-8f162f1e1131"),
    alt: "A tabby cat lying on a sofa",
    credit,
  },
  beagle: {
    src: unsplash("1543466835-00a7907e9de1"),
    alt: "A smiling beagle looking at the camera",
    credit,
  },
  husky: {
    src: unsplash("1568572933382-74d440642117"),
    alt: "A husky with blue eyes against a dark background",
    credit,
  },
  orangeCat: {
    src: unsplash("1596854407944-bf87f6fdd49e"),
    alt: "An orange cat standing on a yellow background",
    credit,
  },
  terrier: {
    src: unsplash("1561037404-61cd46aa615b"),
    alt: "A tricolor terrier looking up at the camera",
    credit,
  },
  retriever: {
    src: unsplash("1552053831-71594a27632d"),
    alt: "A golden retriever carrying a flower in its mouth",
    credit,
  },
  frenchie: {
    src: unsplash("1583511655857-d19b40a7a54e"),
    alt: "A French bulldog wearing a yellow sweater",
    credit,
  },
  playmates: {
    src: unsplash("1450778869180-41d0601e046e"),
    alt: "A dog and a cat curled up together on grass",
    credit,
  },
  longhairCat: {
    src: unsplash("1573865526739-10659fec78a5"),
    alt: "A long-haired ginger cat looking to the side",
    credit,
  },
  corgi: {
    src: unsplash("1537151625747-768eb6cf92b2"),
    alt: "A corgi against an orange wall",
    credit,
  },
  runningDogs: {
    src: unsplash("1548199973-03cce0bbc87b"),
    alt: "Two small dogs running along a path",
    credit,
  },
} satisfies Record<string, SiteImage>;
