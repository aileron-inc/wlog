import type { AssignedRole } from "./roles";

export type GeneratedPost = {
  character: string | null;
  post_type: string;
  source: string;
  body: string;
};

export type PrologueInput = {
  villageName: string;
  characters: AssignedRole[];
  wolfCharacters: AssignedRole[];
  fortuneTeller?: AssignedRole;
  knight?: AssignedRole;
  medium?: AssignedRole;
};

export type DayInput = {
  day: number;
  villageName: string;
  characters: AssignedRole[];
  aliveCharacters: AssignedRole[];
  wolfCharacters: AssignedRole[];
  fortuneTeller?: AssignedRole;
  knight?: AssignedRole;
  medium?: AssignedRole;
  previousSummary: string;
  lastDayExecutedCharacter: string | null;
  lastDayExecutedRole: string | null;
  lastDayAttackedCharacter: string | null;
  lastDayFortuneResult: { teller: string; target: string; result: string } | null;
};

function characterList(chars: AssignedRole[]): string {
  return chars.map((c) => `- ${c.name}（${c.personality}）`).join("\n");
}

export function buildProloguePrompt(input: PrologueInput): { system: string; user: string } {
  const { villageName, characters, wolfCharacters, fortuneTeller, knight, medium } = input;

  const roleInfo: string[] = [];
  roleInfo.push(`人狼が${wolfCharacters.length}人`);
  if (fortuneTeller) roleInfo.push("占い師が1人");
  if (medium) roleInfo.push("霊能者が1人");
  if (knight) roleInfo.push("騎士が1人");

  const system = `あなたは人狼審問というWebゲームのログを生成するAIです。
プロローグフェーズのログを生成してください。

【出力形式】
JSON配列のみを出力。各要素:
{"character": "キャラ名またはnull", "post_type": "タイプ", "source": "villager", "body": "内容"}

【post_type】
- narration: 物語の冒頭（character=キャラ名 の場合、そのキャラ視点のナレーション）
- action: システムメッセージ(character=null) or キャラのRP描写(character=キャラ名)
- join: 参加アナウンス（character=null, "XXXが参加しました。"）
- talk: キャラの発言

【構成（この順番で出力）】
1. action(null): 集会場の状況を物語風に描写（2〜3文）。人狼の噂、不安な空気等。
2. narration(適当なキャラ名): キャラ視点で状況を説明するナレーション（1〜2文）。
3. action(null): 役職構成のアナウンス。「どうやらこの中には、${roleInfo.join("、")}含まれているようだ。」
4. action(null): 生存者一覧。「現在の生存者は、名前1、名前2、…のN名。」
5. 各キャラごと: join(null, "XXXが参加しました。") → talk(キャラ名, 自己紹介1〜3文)
6. 議論開始: talk + action(RP) を10〜15件程度

【ルール】
- 自己紹介は性格を反映したロールプレイ。役職には言及しない。
- talk で >>番号 を使って他者の発言を引用する。
- action(character=名前) でキャラのRPカットインを入れる。
  形式例: 「XXXは、YYYを*じっと見つめた*」「XXXは、メモを貼った」「XXXが「時間を進める」を選択しました」
- 【コミットした】という投票確定宣言も talk に入れる。
- 日本語のみ。自然な会話文。`;

  const user = `以下の参加者でプロローグを生成してください。

【村名】${villageName}
【参加者】
${characterList(characters)}

【人狼】${wolfCharacters.map(c => c.name).join("、")}
${fortuneTeller ? `【占い師】${fortuneTeller.name}` : ""}
${knight ? `【騎士】${knight.name}` : ""}
${medium ? `【霊能者】${medium.name}` : ""}

JSON配列のみを出力してください。`;

  return { system, user };
}

export function buildDayPrompt(input: DayInput): { system: string; user: string } {
  const {
    day,
    villageName,
    aliveCharacters,
    wolfCharacters,
    fortuneTeller,
    knight,
    medium,
    previousSummary,
    lastDayExecutedCharacter,
    lastDayExecutedRole,
    lastDayAttackedCharacter,
    lastDayFortuneResult,
  } = input;

  let phaseRules: string;
  let contextSection: string;

  if (day === 1) {
    phaseRules = `第1日目は議論のみで、投票はありません。
death, vote, fortune, monologue は含めないでください。

【構成】
talk(発言) + action(RPカットイン) + whisper(人狼裏チャット) のみを出力。
15〜25件程度。`;

    contextSection = `プロローグの発言の後に続く第1日目の議論を生成してください。`;
  } else if (day === 2) {
    phaseRules = `第2日目は前日の夜の死者発表 → 占い結果 → 生存者一覧 → 議論。
投票はまだありません（voteは含めないでください）。

【構成（この順番）】
1. death(null): 「次の日の朝、${lastDayAttackedCharacter || "誰も"}${lastDayAttackedCharacter ? "が無惨な姿で発見された。" : "は誰も死ななかった。"}」
2. action(null): ルール説明。「……そして、その日、村には新たなルールが付け加えられた。見分けの付かない人狼を排するため、1日1人ずつ疑わしい者を処刑する。誰を処刑するかは全員の投票によって決める……」
3. fortune(null): 「${fortuneTeller?.name || "占い師"}は、（誰か）を占った……。」
4. action(null): 生存者一覧。
5. talk + action + whisper: 議論。15〜25件程度。`;

    contextSection = `【前日の夜】${lastDayAttackedCharacter ? `${lastDayAttackedCharacter}が人狼に襲撃された。` : "騎士の護衛が成功し、誰も死ななかった。"}`;
  } else {
    phaseRules = `第${day}日目の構成（この順番で出力）:
1. vote(null): 前日の投票結果。全員分、1人1投稿。「XXXはYYYに投票しました」または「XXXはYYYに投票を委任しています。」
2. action(null): 処刑結果。「${lastDayExecutedCharacter || "誰も"}${lastDayExecutedCharacter ? (lastDayExecutedRole === "人狼" ? "は人狼だったようだ。" : "は人間だったようだ。") : ""}」
3. fortune(null): 「${fortuneTeller?.name || "占い師"}は、（誰か）を占った……。」
4. action(null): 生存者一覧。
5. talk + action + whisper: 議論。15〜25件程度。

【投票ルール】
- 前日の議論で▼で吊り希望が出ていたキャラに票が集まりやすい。
- 人狼は自分以外の誰かに投票する。
- 委任投票もある。`;

    contextSection = `【前日の投票結果】${lastDayExecutedCharacter ? `${lastDayExecutedCharacter}が処刑された（${lastDayExecutedRole}）。` : "処刑なし。"}
【前日の夜】${lastDayAttackedCharacter ? `${lastDayAttackedCharacter}が人狼に襲撃された。` : "誰も死ななかった。"}`;
  }

  const fortuneInfo = fortuneTeller ? `【占い師】${fortuneTeller.name}${lastDayFortuneResult ? `（前日: ${lastDayFortuneResult.teller}は${lastDayFortuneResult.target}を占い、${lastDayFortuneResult.result}）` : ""}` : "";
  const mediumInfo = medium ? `【霊能者】${medium.name}` : "";
  const knightInfo = knight ? `【騎士】${knight.name}` : "";

  const system = `あなたは人狼審問というWebゲームのログを生成するAIです。
第${day}日目のログを生成してください。

【出力形式】
JSON配列のみを出力。各要素:
{"character": "キャラ名またはnull", "post_type": "タイプ", "source": "villager"または"player", "body": "内容"}

【post_type】
- death: 翌朝の死者発表（character=null, source=villager）
- action: システムメッセージ(character=null, source=villager) or キャラRP(character=キャラ名, source=villager/player)
- fortune: 占い結果（character=null, source=villager）
- talk: 発言（character=キャラ名, source=villager）
- whisper: 人狼の裏チャット（character=人狼のキャラ名, source=player）
- vote: 個別投票（character=null, source=villager）
- monologue: 霊能者の独白（character=キャラ名, source=player）

${phaseRules}

【共通ルール】
- talk で >>番号 を使って他者の発言を引用する。
- talk で 【役職CO】を行う（例: 「私は占い師よ」「私は霊能者だ」）。Day 2以降は CO が活発になる。
- talk で ▼名前 で吊り希望、●名前 で護衛希望。
- talk で 【コミットした】で投票確定宣言。
- action(character=名前) でキャラのRPカットイン。「XXXは、YYYを*じっと見つめた*」「XXXは、メモを貼った」等。
- action(character=名前) で「XXXが「時間を進める」を選択しました」を散りばめる。
- whisper(source=player) で人狼同士の裏会話（襲撃対象の相談、戦略討論等）。
- 人狼は正体を隠す。source=villager の発言で人狼の役職を明かさない。
- 霊能者がいる場合、前日処刑されたキャラの役職を monologue(source=player) で独白。
- キャラの性格を反映。自然な日本語会話。`;

  const user = `【村名】${villageName} 第${day}日目
【生存者】
${characterList(aliveCharacters)}

【人狼】${wolfCharacters.map(c => c.name).join("、")}
${fortuneInfo}
${mediumInfo}
${knightInfo}

${contextSection}

${previousSummary ? `【これまでの議論の重要ポイント】\n${previousSummary}` : ""}

JSON配列のみを出力してください。`;

  return { system, user };
}
