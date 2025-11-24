export enum Color {
  White = "white",
  Black = "black",
}

export function toColor(color: string): Color {
  if (color === "black") {
    return Color.Black;
  } else if (color === "white") {
    return Color.White;
  }
  throw new Error("Invalid color");
}