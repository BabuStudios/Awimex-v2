import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { palette } from "@/content/content";
import { getDictionary, isLocale, locales, defaultLocale } from "@/content/i18n";
import { t } from "@/lib/format";

export const alt = getDictionary(defaultLocale).meta.ogAlt;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

async function readOptional(path: string): Promise<Buffer | null> {
  try {
    return await readFile(path);
  } catch {
    return null;
  }
}

/** Built from the hero scene poster (scripts/capture-posters.mjs writes a JPEG twin for this). */
export default async function OpengraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const dict = getDictionary(locale);
  const pub = join(process.cwd(), "public");
  const [poster, wordmark] = await Promise.all([
    readOptional(join(pub, "posters/poster-hero.jpg")),
    readOptional(join(pub, "brand/awimex-wordmark.svg")),
  ]);
  const wordmarkSrc = wordmark
    ? `data:image/svg+xml;base64,${Buffer.from(wordmark.toString().replace("<svg ", `<svg fill="${palette.offWhite}" `)).toString("base64")}`
    : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: 72,
          background: `radial-gradient(ellipse at 70% 45%, #3a2a10 0%, ${palette.asphalt} 60%)`,
          color: palette.offWhite,
          position: "relative",
        }}
      >
        {poster && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`data:image/jpeg;base64,${poster.toString("base64")}`}
            alt=""
            width={1200}
            height={630}
            style={{ position: "absolute", inset: 0, objectFit: "cover" }}
          />
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(90deg, ${palette.asphalt}E6 0%, ${palette.asphalt}66 55%, ${palette.asphalt}00 100%)`,
          }}
        />
        {wordmarkSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={wordmarkSrc} alt="" width={288} height={34} style={{ marginBottom: 36 }} />
        )}
        <div style={{ display: "flex", width: 72, height: 4, background: palette.amber, marginBottom: 28 }} />
        <div style={{ display: "flex", fontSize: 60, fontWeight: 800, lineHeight: 1.05, maxWidth: 820 }}>
          {t(dict.scenes.hero.heading, locale)}
        </div>
      </div>
    ),
    size,
  );
}
