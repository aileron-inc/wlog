type CharacterEntry = { name: string; avatar: string };

const characters: CharacterEntry[] = [
  { name: "自警団長 アーヴァイン", avatar: "https://asbntby.sakura.ne.jp/junalog/b1/img/01.png" },
  { name: "新米記者 ソフィー", avatar: "https://asbntby.sakura.ne.jp/junalog/b1/img/31.png" },
  { name: "お嬢様 ヘンリエッタ", avatar: "https://asbntby.sakura.ne.jp/junalog/b1/img/33.png" },
  { name: "木こり ダニエル", avatar: "https://asbntby.sakura.ne.jp/junalog/b1/img/15.png" },
  { name: "文学少女 セシリア", avatar: "https://asbntby.sakura.ne.jp/junalog/b1/img/43.png" },
  { name: "酒場の看板娘 ローズマリー", avatar: "https://asbntby.sakura.ne.jp/junalog/b1/img/14.png" },
  { name: "双子 ウェンディ", avatar: "https://asbntby.sakura.ne.jp/junalog/b1/img/08.png" },
  { name: "流れ者 ギルバート", avatar: "https://asbntby.sakura.ne.jp/junalog/b1/img/10.png" },
  { name: "冒険家 ナサニエル", avatar: "https://asbntby.sakura.ne.jp/junalog/b1/img/28.png" },
  { name: "修道女 ステラ", avatar: "https://asbntby.sakura.ne.jp/junalog/b1/img/22.png" },
  { name: "牧童 トビー", avatar: "https://asbntby.sakura.ne.jp/junalog/b1/img/32.png" },
  { name: "異国人 マンジロー", avatar: "https://asbntby.sakura.ne.jp/junalog/b1/img/26.png" },
  { name: "学生 ラッセル", avatar: "https://asbntby.sakura.ne.jp/junalog/b1/img/30.png" },
  { name: "のんだくれ ケネス", avatar: "https://asbntby.sakura.ne.jp/junalog/b1/img/16.png" },
  { name: "逃亡者 カミーラ", avatar: "https://asbntby.sakura.ne.jp/junalog/b1/img/38.png" },
  { name: "お尋ね者 クインジー", avatar: "https://asbntby.sakura.ne.jp/junalog/b1/img/37.png" }
];

export function getCharacterAvatar(name: string | null): string | null {
  if (!name) return null;
  const entry = characters.find((c) => c.name === name);
  return entry?.avatar ?? null;
}
