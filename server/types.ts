export interface RoundRecord {
  round: number;
  prepTime: number;
  diveTime: number;
}

export interface SessionRecord {
  id: string;
  date: string;
  rounds: RoundRecord[];
}
