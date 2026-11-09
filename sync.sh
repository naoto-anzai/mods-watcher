#!/bin/sh
# sync.sh <実体フォルダ> <mods/<name>>
# 実体フォルダの中身を、mods/<name>/ に 1 つずつシンボリックリンクとして並べる。
# mods/<name>/ は実フォルダ。そこに置く reload-trigger を touch すると、Herdr がその Mod を読み直す
# (リンク先の変更は Herdr に見えないため)。
# 除外: 隠しファイル(glob に出ない)、node_modules、アプリが書く gpui-kit.d.ts / jsconfig.json / tsconfig.json、*.md
set -u
src=$1; dest=$2
mkdir -p "$dest"
for p in "$src"/*; do
  [ -e "$p" ] || continue
  n=$(basename "$p")
  case "$n" in node_modules|gpui-kit.d.ts|jsconfig.json|tsconfig.json|*.md|reload-trigger) continue ;; esac
  l="$dest/$n"
  if [ -L "$l" ]; then
    [ "$(readlink "$l")" = "$p" ] || { rm "$l"; ln -s "$p" "$l"; }
  elif [ ! -e "$l" ]; then
    ln -s "$p" "$l"
  fi
done
# 実体から消えたものの、宙に浮いたリンクを外す
for l in "$dest"/*; do
  [ -L "$l" ] && [ ! -e "$l" ] && rm "$l"
done
[ -e "$dest/reload-trigger" ] || echo trigger > "$dest/reload-trigger"
exit 0
