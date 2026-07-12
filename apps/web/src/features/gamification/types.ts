export type Challenge = {
  id: string;
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  xpReward: number;
  endDate: string;
  participantCount: number;
  joined?: boolean;
};
