# budget-sample

Budget Guard（セクション6）の題材です。JavaScript 7ファイルの小さなプロジェクトで、`src/utils/price.js` の `formatPrice` がほかの5ファイルから使われています。

```bash
cd budget-sample
node src/index.js   # 動作確認（Node.js が入っていれば依存パッケージなしで動く）
```

6-4 では、ここで小さな予算を決めて Claude に「`formatPrice` の使われ方を調べてから、引数名を変えて」と頼み、予算の70%を超えた後に起動したサブエージェントが Haiku で動くことを確かめます（プロンプトは配布資料の「プロンプト集」にあります）。

作業のあとで元に戻すときは、`git checkout -- .` を実行してください。
