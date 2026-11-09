# mods-watcher

Herdr のホットリロードは、リンク先(`~/Projects/herdr-mods/<name>`)の変更を検知しない。
そこで `mods/<name>/` を実フォルダにして、中身を実体へのシンボリックリンクで並べ、`reload-trigger`(実ファイル)だけを置く。
mods-watcher が実体の変更を検知したら、リンクを同期して `reload-trigger` を touch し、Herdr に読み直させる。

- 管理対象: `mods/<name>/` が実フォルダで、`reload-trigger` と実体へのリンクの `main.js` を持つ Mod
- `sync.sh <実体> <mods/<name>>`: リンクを揃える。新しいファイルを足した/消したときも、検知後に自動で呼ばれる
- 除外: 隠しファイル、`node_modules`、`gpui-kit.d.ts`、`jsconfig.json`、`tsconfig.json`、`*.md`
- 画面には何も描かない。`layout-mine/mine.json` の `floating` で常駐させている
- 新しい Mod を管理対象にする: `sh ~/Projects/herdr-mods/mods-watcher/sync.sh ~/Projects/herdr-mods/<name> ~/.config/herdr-app/mods/<name>`
  (すでに `mods/<name>` が実体へのシンボリックリンクなら、先に `rm` で外す)

## 導入

1. このフォルダを `~/Projects/herdr-mods/mods-watcher` に置く(`main.js` が `~/Projects/herdr-mods` を前提にしている)。
2. `~/.config/herdr-app/mods/mods-watcher` へシンボリックリンクを張る:
   `ln -s ~/Projects/herdr-mods/mods-watcher ~/.config/herdr-app/mods/mods-watcher`
3. 画面を持たない Mod なので、layout の `floating` などで常駐させる。
4. `herdr-app check mods-watcher` でエラーが出ないことを確認する。

## 使い方

管理したい Mod ごとに、上の「新しい Mod を管理対象にする」のコマンドを 1 回実行する。
以後は実体を編集すると、数百ミリ秒〜数秒で mods-watcher がリンクを同期し、Herdr がその Mod を読み直す。
30 秒ごとに `mods/` を走査するので、新しく管理対象にした Mod も自動で監視に加わる。
