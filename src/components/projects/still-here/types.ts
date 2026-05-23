export type Sex = "M" | "F" | "B";

export interface CountryEntry {
  code: string;
  name: string;
}

export interface CountryTable {
  year: number;
  M: number[];
  F: number[];
  B: number[];
}

export interface LifeTablesData {
  source: string;
  fetchedAt: string;
  latestYear: number;
  ageBands: string[];
  bandStartAge: number[];
  countries: CountryEntry[];
  tables: Record<string, CountryTable>;
}

export interface Inputs {
  birthYear: number;
  sex: Sex;
  countryCode: string;
}
