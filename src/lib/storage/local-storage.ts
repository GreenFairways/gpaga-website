import type { RoundScore } from "../handicap/types";
import type { HandicapStorage } from "./types";

const STORAGE_KEY = "gpaga-handicap-rounds";

export class LocalHandicapStorage implements HandicapStorage {
  getRounds(): RoundScore[] {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as RoundScore[];
    } catch {
      return [];
    }
  }

  addRound(round: RoundScore): void {
    const rounds = this.getRounds();
    rounds.push(round);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rounds));
  }

  deleteRound(id: string): void {
    const rounds = this.getRounds().filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rounds));
  }

  exportData(): string {
    return JSON.stringify(this.getRounds(), null, 2);
  }

  importData(json: string): void {
    const rounds = JSON.parse(json) as RoundScore[];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rounds));
  }

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}
