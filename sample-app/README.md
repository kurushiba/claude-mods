# sample-app

Test Pilot（セクション4〜5）の題材です。小さなショッピングカートの計算処理と、42件のテストが入っています。

```bash
cd sample-app
npm test              # テストを1回走らせる（42 passed）
npm run test:watch    # src/ と test/ の変更を見張り、変わるたびにテストを走らせる（4-6 で使う）
```

依存パッケージはありません（`npm install` は不要）。Node.js 標準の `node --test` で動きます。

## テストをわざと失敗させる（5-3 で使う）

`src/price.js` の `shippingFee` の `5000` を `3000` に書き換えて保存すると、合計金額のテストが1件失敗します（`41 passed, 1 failed`）。元に戻せば全件通ります。
