export interface Boss {
  id: string;
  bossName: string;
  petName: string;
  dropRate: number;
  image: string;
}

export interface BossResult {
  bossId: string;
  killCount: number;
}
