export interface Opening {
    name: string;
    frenchName: string;
    fen: string;
    previousMoveFen: string;
    category: string;
    difficulty: number;
}

export function computeOpeningName(opening: Opening, language: string): string {
    if (language === 'fr') {
        return opening.frenchName;
    }
    return opening.name;
}