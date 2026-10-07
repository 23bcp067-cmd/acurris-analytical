import fs from "node:fs";
import path from "node:path";

const ICON_DIR = "node_modules/lucide-static/icons";
const iconCache = new Map();

function icon(name, cls = "icon") {
  if (!iconCache.has(name)) {
    const file = path.join(ICON_DIR, `${name}.svg`);
    if (!fs.existsSync(file)) throw new Error(`Unknown icon: ${name}`);
    let svg = fs.readFileSync(file, "utf8").replace(/<!--[\s\S]*?-->/g, "").trim();
    svg = svg
      .replace(/<svg[^>]*>/, (tag) =>
        tag.replace(/\s(class|width|height)="[^"]*"/g, "").replace("<svg", '<svg aria-hidden="true" focusable="false"')
      )
      .replace(/\s*\n\s*/g, " ");
    iconCache.set(name, svg);
  }
  return iconCache.get(name).replace("<svg", `<svg class="${cls}"`);
}

export default function (config) {
  config.addPassthroughCopy({ "src/assets": "assets" });
  config.addPassthroughCopy({ "src/api": "api" });
  config.addPassthroughCopy({ "src/static/.htaccess": ".htaccess" });

  config.addShortcode("icon", icon);

  // Markdown tables can scroll sideways on phones, so make them keyboard-focusable.
  config.addTransform("focusable-tables", (content, outputPath) =>
    outputPath && outputPath.endsWith(".html") ? content.replace(/<table>/g, '<table tabindex="0">') : content
  );

  config.addFilter("findBySlug", (list, slug) => list.find((x) => x.slug === slug));
  config.addFilter("whereGroup", (list, group) => list.filter((x) => x.group === group));
  config.addFilter("isoDate", (d) => new Date(d).toISOString().slice(0, 10));
  config.addFilter("readableDate", (d) =>
    new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })
  );
  config.addFilter("readTime", (content) => {
    const words = String(content || "").replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 220));
  });
  config.addFilter("json", (v) => JSON.stringify(v));

  config.addCollection("articles", (api) =>
    api.getFilteredByGlob("src/resources/articles/*.md").sort((a, b) => (a.data.order || 99) - (b.data.order || 99))
  );

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    templateFormats: ["njk", "md"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
