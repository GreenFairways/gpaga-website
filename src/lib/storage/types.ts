import type { RoundScore } from "../handicap/types";

export interface HandicapStorage {
  getRounds(): RoundScore[];
  addRound(round: RoundScore): void;
  deleteRound(id: string): void;
  exportData(): string;
  importData(json: string): void;
  clear(): void;
}
