# 09-distribution

`tool-tally/` は、Mod を GitHub で配るときのリポジトリのひな形です（中身は 2章の first-mod と同じ）。

1. `tool-tally/` の中身を、新しい GitHub リポジトリのいちばん上に置く
2. `your-name` を自分の GitHub ユーザー名に置き換える（`plugin.json`・`marketplace.json`・`README.md`）
3. `claude plugin validate --strict .`・`tsc -p .`・`claude plugin test .` が通ることを確かめてからプッシュする

`plugin.json` の `name` は後から変えられません（変えると別のプラグイン扱いになります）。`claude-` で始まる名前や `claude-mods` など、Anthropic 公式に見える名前は validate で弾かれます。
