export type Hotline = { name: string; phone: string; tel: string };

export type HotlineRegion = {
  code: string;
  name: string;
  lines: Hotline[];
  note: string;
};

const ASPCA: Hotline = {
  name: "ASPCA Animal Poison Control",
  phone: "(888) 426-4435",
  tel: "tel:+18884264435",
};
const PET_POISON_HELPLINE: Hotline = {
  name: "Pet Poison Helpline",
  phone: "(855) 764-7661",
  tel: "tel:+18557647661",
};

const REGIONS: HotlineRegion[] = [
  {
    code: "US",
    name: "United States",
    lines: [ASPCA, PET_POISON_HELPLINE],
    note: "Fees may apply.",
  },
  {
    code: "CA",
    name: "Canada",
    lines: [ASPCA, PET_POISON_HELPLINE],
    note: "US-based services that also take calls from Canada. Fees may apply.",
  },
  {
    code: "GB",
    name: "United Kingdom",
    lines: [
      {
        name: "Animal PoisonLine",
        phone: "01202 509000",
        tel: "tel:+441202509000",
      },
    ],
    note: "24-hour line. A fee applies.",
  },
  {
    code: "AU",
    name: "Australia",
    lines: [
      {
        name: "Animal Poisons Helpline",
        phone: "1300 869 738",
        tel: "tel:1300869738",
      },
    ],
    note: "Hours and fees vary, so check their website. Call your vet first if it is urgent.",
  },
  {
    code: "NZ",
    name: "New Zealand",
    lines: [
      {
        name: "NZ Animal Poisons Helpline",
        phone: "0800 869 738",
        tel: "tel:0800869738",
      },
    ],
    note: "Charges may apply. Call your vet first if it is urgent.",
  },
];

const OTHER: HotlineRegion = {
  code: "OTHER",
  name: "Other country",
  lines: [],
  note: "We do not have a verified pet poison hotline for this country. Call your local vet or the nearest emergency animal clinic and say what your pet ate.",
};

export const COUNTRY_OPTIONS: { code: string; name: string }[] = [
  ...REGIONS.map(({ code, name }) => ({ code, name })),
  { code: OTHER.code, name: OTHER.name },
];

export function getHotlineRegion(code?: string | null): HotlineRegion {
  const normalized = code?.trim().toUpperCase();
  return REGIONS.find((r) => r.code === normalized) ?? OTHER;
}
