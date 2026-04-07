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

let _countries: CountryOption[] | null = null;

export function getCountries(): CountryOption[] {
  if (_countries) return _countries;
  const seen = new Set<string>();
  const result: CountryOption[] = [];
  for (const entry of data) {
    if (!seen.has(entry.COUNTRY)) {
      seen.add(entry.COUNTRY);
      const allEntry = data.find((e) => e.COUNTRY === entry.COUNTRY && e.REGION === "");
      let name = allEntry?.Trip ?? entry.Trip ?? entry.COUNTRY;
      name = name.replace(/, All Country$/, "").trim();
      result.push({ code: entry.COUNTRY, name });
    }
  }
  _countries = result.sort((a, b) => a.code.localeCompare(b.code));
  return _countries;
}

const _citiesCache: Record<string, CityOption[]> = {};

export function getCities(countryCode: string): CityOption[] {
  if (_citiesCache[countryCode]) return _citiesCache[countryCode];
  const countryEntry = data.find((e) => e.COUNTRY === countryCode && e.REGION === "");
  const countryName = countryEntry
    ? countryEntry.Trip.replace(/, All Country$/, "").trim()
    : countryCode;
  const cities = data
    .filter((e) => e.COUNTRY === countryCode && e.REGION !== "")
    .map((e) => {
      const prefix = countryName + ", ";
      const name = e.Trip.startsWith(prefix)
        ? e.Trip.slice(prefix.length).trim()
        : e.Trip;
      return { code: e.REGION, name };
    });
  _citiesCache[countryCode] = cities;
  return cities;
}
