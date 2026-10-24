# Claude Code Mods 入門 講座用リポジトリ

講座「Claude Code Mods入門」の進行に使う教材です。Mod をかける題材のプロジェクト、練習用の Mod の骨組み、わざと壊した Mod、講座で作る2つの Mod の完成版などを置いています。処理は各レクチャーで自分で書くので、書き終えた Mod はこのリポジトリには入っていません。

- 動作を確かめたバージョン：**Claude Code v2.1.289**
- Mod は TypeScript で書いています（画面を描かない Mod は `register.ts`、画面を描く Mod は `register.tsx`）。Claude Code が TypeScript のまま読み込むので、実行にビルドは要りません
- Mods は公開されたばかりの機能で、版ごとに仕様が変わることがあります。動画とずれたら、Mod を読み込んだときに自動で作られる `.claude-plugin/types/claude-code/index.d.ts`（型定義）を正としてください（2-7）

## 使い方

Mod はインストールせず、`--plugin-dir` でフォルダを指定して読み込みます。VS Code を使う場合も、**統合ターミナルで** `claude` を起動してください（拡張のチャットパネルでは、Mod が描いた画面が表示されません）。

```bash
# 例：2章で自分で作った Mod を読み込む
claude --plugin-dir ./first-mod

# 例：Test Pilot の完成版を、題材の sample-app で動かす
cd sample-app
claude --plugin-dir ../final/test-pilot
```

確かめるためのコマンド：

```bash
claude plugin validate <Mod のフォルダ>   # Mod を動かさずに、何に反応して何を使うかを表示する
tsc -p <Mod のフォルダ>                   # 型をチェックする（Mod を一度読み込んで型定義が作られてから）
claude plugin test <Mod のフォルダ>       # Mod の中の tests/*.test.ts を実行する
```

`tsc` は TypeScript のコマンドです。最初に一度 `npm install -g typescript` で入れておいてください（`npx tsc` は TypeScript とは別のパッケージを取りに行ってしまうので使いません）。

## フォルダ構成

| フォルダ | セクション | 中身 |
|---|---|---|
| `final/` | 0・6 | 講座で作る2つの Mod の完成版（`test-pilot/`・`budget-guard/`）。0-1 のデモで動かす。`tests/` も入っているが、テストの書き方は本編では扱わない |
| `02-first-mod/broken/` | 2 | わざと壊した Mod（2-5 の文法エラー、2-7 の validate・tsc で落ちる例） |
| `03-events/` | 3 | 各レクチャーの練習用 Mod の骨組み（`3-1-start`〜`3-4-start`）、秘密のファイルを読ませないガード（`3-5-secret-guard/`。`BREAK` を `true` にしてエラーを起こし、`.catch` を書き足して直す） |
| `04-test-pilot/` | 4 | 各レクチャーの始まりの Test Pilot（`4-4-start`・`4-6-start`。前のレクチャーの完成版。中身の `hooks/register.ts` を、自分で作った `test-pilot/hooks/register.ts` に貼って使う）と、fail-open を確かめるための Test Pilot（`4-6/`。`BREAK` を `true` にしてエラーを起こす） |
| `05-ui/` | 5 | 5-1 の始まりの Test Pilot（`5-1-start`。4-6 の完成版。`test-pilot/hooks/register.ts` を上書きして使う）、refused を起こす Mod（`broken/`。追加候補13 用で、本編では使わない） |
| `08-testing/` | ― | テスト付きの Mod と、エラーをわざと起こす Mod（`errors/`）。追加候補用で、本編では使わない |
| `09-distribution/` | ― | GitHub で Mod を配るときのひな形（`tool-tally/`）。追加候補用で、本編では使わない |
| `sample-app/` | 4・5 | Test Pilot の題材。`npm test` で42件のテストが走る |
| `test-pilot/` | 4・5 | リポジトリには入っていない。4-3 で、Claude が書いた Test Pilot を `dev-mods` からここにコピーし、4・5章で育てる |
| `budget-sample/` | 6 | Budget Guard の題材。JavaScript 7ファイル |
| `step-logger/` | 6 | リクエストごとに実際に答えたモデルを記録するログ用の Mod（6-4 で読み込み、6-5 で中身を読む） |

## 注意

- Mod はサンドボックスなしで、あなたと同じ権限で動きます。このリポジトリの Mod も、読み込む前に `claude plugin validate` で何をするかを確かめる習慣をつけてください（1-4・6-13）
- `08-testing/errors/2-worker-crash` はわざと無限ループを起こします。練習用のセッションだけで試してください
- Test Pilot は Git でコードの変化を調べるため、`sample-app/` は Git リポジトリの中（このリポジトリをクローンしたフォルダ）で使ってください
