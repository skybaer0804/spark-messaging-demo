export type Category = '인테리어' | '웹개발' | '피규어';

export interface Room {
  roomId: string;
  category: Category;
  title: string;
  participants: number;
  creatorId: string;
  createdAt: number;
}
