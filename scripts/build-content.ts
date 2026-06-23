/**
 * Build script: converts /content/projects/*.md → /public/content.json
 *
 * Run with: npx tsx scripts/build-content.ts
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = resolve(__dirname, "..", "content", "projects");
const OUTPUT_PATH = resolve(__dirname, "..", "public", "content.json");

interface Frontmatter {
  title: string;
  description: string;
  tags: string[];
  imageUrl?: string;
  liveUrl?: string;
  repoUrl?: string;
  date: string;
}

function parseFrontmatter(
  raw: string,
): { frontmatter: Frontmatter; body: string } {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!match) {
    throw new Error(
      "Markdown file must have YAML-style frontmatter delimited by ---",
    );
  }

  const fmStr = match[1];
  const body = match[2].trim();

  // Minimal frontmatter parser (avoids heavy yaml dep at build time)
  const frontmatter: Partial<Frontmatter> = {};
  for (const line of fmStr.split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;

    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();

    // Handle JSON arrays like ["React", "Node.js"]
    if (value.startsWith("[")) {
      try {
        value = JSON.parse(value);
      } catch {
        // fallback: treat as string
      }
    } else {
      // Strip surrounding quotes
      value = value.replace(/^["']|["']$/g, "");
    }

    frontmatter[key] = value;
  }

  if (!frontmatter.title || !frontmatter.description || !frontmatter.date) {
    throw new Error("Frontmatter must include: title, description, date");
  }

  return {
    frontmatter: frontmatter as Frontmatter,
    body,
  };
}

async function main() {
  const files = readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md"));

  if (files.length === 0) {
    console.warn("No .md files found in", CONTENT_DIR);
    writeFileSync(OUTPUT_PATH, JSON.stringify({ projects: [] }, null, 2));
    return;
  }

  const processor = unified()
    .use(remarkParse)
    .use(remarkRehype, { allowDangerousHtml: false })
    .use(rehypeStringify, { allowDangerousHtml: false });

  const projects = await Promise.all(
    files.map(async (file) => {
      const filePath = resolve(CONTENT_DIR, file);
      const raw = readFileSync(filePath, "utf-8");
      const { frontmatter, body } = parseFrontmatter(raw);

      // Convert markdown body to HTML
      const html = String(await processor.process(body));

      return {
        slug: basename(file, ".md"),
        title: frontmatter.title,
        description: frontmatter.description,
        tags: frontmatter.tags ?? [],
        imageUrl: frontmatter.imageUrl,
        liveUrl: frontmatter.liveUrl,
        repoUrl: frontmatter.repoUrl,
        date: frontmatter.date,
        bodyHtml: html.trim(),
      };
    }),
  );

  // Sort by date descending
  projects.sort((a, b) => b.date.localeCompare(a.date));

  const output = JSON.stringify({ projects }, null, 2);
  writeFileSync(OUTPUT_PATH, output);

  console.log(`✅ Built ${projects.length} projects → ${OUTPUT_PATH}`);
}

main().catch(console.error);
