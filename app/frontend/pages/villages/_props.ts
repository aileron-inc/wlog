export type VillageIndexProps = {
  tags: { id: string; name: string }[];
  villages: {
    id: string;
    village_number: number;
    name: string;
    tags: { id: string; name: string }[];
  }[];
  total_count: number;
  page: number;
  per_page: number;
};

export type VillageAboutProps = {
  village: {
    id: string;
    village_number: number;
    name: string;
    characters: string;
    status: string | null;
    winner: string | null;
  };
  available_days: string[];
  post_counts: { villager: number; player: number };
  players: {
    name: string;
    avatar_url: string | null;
    post_count: number;
    role: string | null;
    is_alive: number | null;
    team: string | null;
  }[];
};

export type VillageDayProps = {
  village_id: string;
  day: string;
  source: string;
  spoiler: string;
  page: number;
  per_page: number;
  total_count: number;
  total_pages: number;
  available_days: string[];
  posts: import("./_post").PostData[];
};
