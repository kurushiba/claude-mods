# router-sample

Model Router（セクション7）の題材です。JavaScript 7ファイルの小さなプロジェクトで、`src/utils/price.js` の `formatPrice` がほかの5ファイルから使われています。

```bash
cd router-sample
node src/index.js   # 動作確認（Node.js が入っていれば依存パッケージなしで動く）
```

7-3 では、ここで Claude に「`formatPrice` の使われ方を調べてから、引数名を変えて」と頼み、調査は Haiku のサブエージェント、修正はメインのモデルで動くことを確かめます（プロンプトは配布資料の「プロンプト集」にあります）。

作業のあとで元に戻すときは、`git checkout -- .` を実行してください。
