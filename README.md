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
| `final/` | 0・10 | 講座で作る2つの Mod の完成版（`test-pilot/`・`model-router/`）。テスト付き |
| `02-first-mod/broken/` | 2 | わざと壊した Mod（2-5 の文法エラー、2-7 の validate・tsc で落ちる例） |
| `03-events/` | 3 | 各レクチャーの練習用 Mod の骨組み（`3-1-start`〜`3-4-start`）、マッチャーの失敗例（`3-1-matchers-broken`）、強制プッシュのガード（`3-5-force-push-guard/`。`BREAK` を `true` にしてエラーを起こし、`.catch` を書き足して直す） |
| `04-test-pilot/4-5/` | 4 | fail-open を確かめるための Test Pilot（`BREAK` を `true` にしてエラーを起こす） |
| `05-ui/broken/` | 5 | refused を起こす Mod（5-4） |
| `08-testing/errors/` | 8 | エラーをわざと起こす Mod（8-3） |
| `09-distribution/` | 9 | GitHub で Mod を配るときのひな形（`tool-tally/`） |
| `sample-app/` | 4・5 | Test Pilot の題材。`npm test` で42件のテストが走る |
| `router-sample/` | 7 | Model Router の題材。JavaScript 7ファイル |

## 注意

- Mod はサンドボックスなしで、あなたと同じ権限で動きます。このリポジトリの Mod も、読み込む前に `claude plugin validate` で何をするかを確かめる習慣をつけてください（1-4・10-1）
- `08-testing/errors/2-worker-crash` はわざと無限ループを起こします。練習用のセッションだけで試してください
- Test Pilot は Git でコードの変化を調べるため、`sample-app/` は Git リポジトリの中（このリポジトリをクローンしたフォルダ）で使ってください
