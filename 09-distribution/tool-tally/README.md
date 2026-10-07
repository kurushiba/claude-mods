# tool-tally

Claude Code の Mod です。Claude が作業中に出す「Thinking…」の表示に道具の使用回数を出し、`/tally` で回数を答えます。

## 動作を確かめたバージョン

- Claude Code v2.1.289（Mods は版ごとに仕様が変わることがあります）

## インストール

```bash
claude plugin marketplace add your-name/tool-tally
claude plugin install tool-tally@your-name-mods
```

起動中のセッションでは `/reload-plugins` を実行すると読み込まれます。

## この Mod がすること

`claude plugin validate` の結果：

```
hooks: session.start, tool.call, ui.render{component=Spinner}, command.run{command=tally}
calls: $.command.register, $.ui.invalidate
```

- ファイルの読み書き・プログラムの起動・ネットワーク通信はしません
- 道具の使用を数えるだけで、止めたり書き換えたりはしません

## 開発

```bash
claude --plugin-dir .          # 作業中のフォルダを読み込んで試す
claude plugin validate --strict .
tsc -p .                       # 型をチェックする（一度読み込んで型定義が作られてから）
claude plugin test .
```

更新を届けるときは `.claude-plugin/plugin.json` の `version` を上げてからプッシュします。
