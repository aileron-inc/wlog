export type Character = {
  name: string;
  role: string;
  personality: string;
};

export const CHARACTER_POOL: Character[] = [
  { name: "村長の娘 シャーロット", role: "村人", personality: "気品があるが親しみやすい。村のまとめ役" },
  { name: "見習いメイド ネリー", role: "村人", personality: "元気で少しドジな少女。敬語が崩れがち" },
  { name: "語り部 デボラ", role: "村人", personality: "年配の女性。昔話を語るのが好き" },
  { name: "医師 ヴィンセント", role: "村人", personality: "冷静沈着。科学的な視点を持つ" },
  { name: "隠者 モーガン", role: "村人", personality: "物言わぬ老人。不思議な雰囲気" },
  { name: "双子 ウェンディ", role: "村人", personality: "無邪気な子供。誰にでも懐く" },
  { name: "流れ者 ギルバート", role: "村人", personality: "旅の男。微笑みながら危険なことを言う" },
  { name: "修道女 ステラ", role: "村人", personality: "信仰深く優しい。癒しの存在" },
  { name: "木こり ダニエル", role: "村人", personality: "寡黙で筋肉質。守り役" },
  { name: "酒場の看板娘 ローズマリー", role: "村人", personality: "明るく社交的。情報を巧みに集める" },
  { name: "学生 ラッセル", role: "村人", personality: "好奇心旺盛な青年。論理的に考える" },
  { name: "冒険家 ナサニエル", role: "村人", personality: "豪快で自信家。人を引っ張るタイプ" },
  { name: "墓守 ユージーン", role: "村人", personality: "静かで真面目。死に親しい" },
  { name: "文学少女 セシリア", role: "村人", personality: "内気で読書家。観察眼が鋭い" },
  { name: "のんだくれ ケネス", role: "村人", personality: "酒好きのおじさん。憎めない存在" },
];

export function shuffle<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}
