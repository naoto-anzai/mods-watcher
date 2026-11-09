import { View, div } from "gpui-kit";
import { exec, appHome, home, watchFolder } from "herdr";

const ROOT = `${home()}/Projects/herdr-mods`;
const SYNC = `${ROOT}/mods-watcher/sync.sh`;
const DEBOUNCE = "0.3";

// 管理対象: mods/<name>/ が実フォルダで、reload-trigger と、実体へのリンクの main.js を持つ Mod。
// 実体の変更を検知したら、リンクを同期し、reload-trigger を touch して Herdr に読み直させる。
// (リンク先の変更は Herdr のホットリロードに見えないため。)画面には何も描かない(layout の floating で常駐)。
export default class ModsWatcher extends View {
  init(_props, cx) {
    this.watching = new Set();
    this.scan(cx);
    cx.timer.every(30000, (cx) => this.scan(cx));
  }

  scan(cx) {
    cx.spawn(async (cx) => {
      const mods = `${appHome()}/mods`;
      const r = await exec("sh", ["-c",
        'for d in "$1"/*/; do d=${d%/}; [ -L "$d" ] && continue; [ -f "$d/reload-trigger" ] || continue; [ -L "$d/main.js" ] || continue; printf "%s\\t%s\\n" "$(basename "$d")" "$(dirname "$(readlink "$d/main.js")")"; done',
        "sh", mods]);
      for (const line of r.stdout.split("\n")) {
        const [name, src] = line.split("\t");
        if (!name || !src || this.watching.has(name)) continue;
        this.watching.add(name);
        const dest = `${mods}/${name}`;
        await exec("sh", [SYNC, src, dest]); // 起動時はリンクを揃えるだけ(touch はしない)
        this.follow(cx, name, src, dest);
      }
    });
  }

  follow(cx, name, src, dest) {
    cx.spawn(async (cx) => {
      try {
        for (;;) {
          const paths = (await watchFolder(src)).filter((p) => {
            const rel = p.slice(src.length + 1);
            return rel && !rel.split("/").some((s) => s.startsWith(".") || s === "node_modules") &&
              !/(^|\/)(gpui-kit\.d\.ts|jsconfig\.json|tsconfig\.json)$/.test(rel);
          });
          if (!paths.length) continue;
          await exec("sleep", [DEBOUNCE]); // 続けて保存された分をまとめる
          await exec("sh", [SYNC, src, dest]);
          await exec("touch", [`${dest}/reload-trigger`]);
        }
      } catch (e) {
        console.log(`mods-watcher: ${name}: ${e}`);
        this.watching.delete(name); // 次の scan でやり直す
      }
    });
  }

  render(_cx) {
    return div();
  }
}
