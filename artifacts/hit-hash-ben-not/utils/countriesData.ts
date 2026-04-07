import rawData from "@/assets/CountriesAndCities.json";

interface CountryEntry {
  COUNTRY: string;
  REGION: string;
  Trip: string;
}

const data = rawData as CountryEntry[];

export interface CountryOption {
  code: string;
  name: string;
}

export interface CityOption {
  code: string;
  name: string;
}

function normalizeLabel(raw: string): string {
  let s = raw.trim();
  s = s.replace(/, All Country$/i, "").trim();
  if (s.includes(", ")) {
    const parts = s.split(", ");
    const last = parts[parts.length - 1];
    if (last) s = last.trim();
  }
  return s;
}

let _countries: CountryOption[] | null = null;

export function getCountries(): CountryOption[] {
  if (_countries) return _countries;
  const seen = new Set<string>();
  const result: CountryOption[] = [];
  for (const entry of data) {
    if (!seen.has(entry.COUNTRY)) {
      seen.add(entry.COUNTRY);
      const allEntry = data.find((e) => e.COUNTRY === entry.COUNTRY && e.REGION === "");
      const rawName = allEntry?.Trip ?? entry.Trip ?? entry.COUNTRY;
      const name = allEntry
        ? rawName.replace(/, All Country$/i, "").trim()
        : normalizeLabel(rawName);
      result.push({ code: entry.COUNTRY, name });
    }
  }
  _countries = result.sort((a, b) => a.name.localeCompare(b.name));
  return _countries;
}

const _citiesCache: Record<string, CityOption[]> = {};

export function getCities(countryCode: string): CityOption[] {
  if (_citiesCache[countryCode]) return _citiesCache[countryCode];
  const countryEntry = data.find((e) => e.COUNTRY === countryCode && e.REGION === "");
  const countryName = countryEntry
    ? countryEntry.Trip.replace(/, All Country$/i, "").trim()
    : "";
  const prefix = countryName ? countryName + ", " : null;
  const specific = data
    .filter((e) => e.COUNTRY === countryCode && e.REGION !== "")
    .map((e) => {
      let name = e.Trip;
      if (prefix && name.startsWith(prefix)) {
        name = name.slice(prefix.length).trim();
      }
      return { code: e.REGION, name };
    })
    .filter((c, i, arr) => arr.findIndex((x) => x.code === c.code) === i);
  const cities: CityOption[] =
    specific.length > 0
      ? specific
      : [{ code: "ALL", name: "(All Country)" }];
  _citiesCache[countryCode] = cities;
  return cities;
}
