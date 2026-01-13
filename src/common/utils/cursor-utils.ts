export const createCursor = (value: string) => {
  if (!value) {
    return null;
  }

  const cursor = Buffer.from(value, "utf-8").toString("base64");

  return cursor;
};

export function parseCursor(value: string, option: "date"): Date;
export function parseCursor(value: string, option: "number"): number;
export function parseCursor(value: string, option: "string"): string;
export function parseCursor(
  value: string,
  option: "date" | "number" | "string" = "string"
): Date | number | string {
  if (option === "date") {
    const decodedString = Buffer.from(value, "base64").toString();

    return new Date(decodedString);
  }

  if (option === "number") {
    return Number(value);
  }

  return value;
}
