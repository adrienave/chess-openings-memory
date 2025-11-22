import Papa from "papaparse";

export function parseCSVContent(rawCsv: string) {
  const result = Papa.parse(rawCsv, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  return result.data;
}