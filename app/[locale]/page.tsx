import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/content/i18n";
import { I18nProvider } from "@/lib/i18n-context";
import { SemanticMirror } from "@/seo/SemanticMirror";
import { BridgeModal } from "@/overlay/BridgeModal";
import { StaticStory } from "@/static/StaticStory";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  return (
    <I18nProvider locale={locale} dict={dict}>
      <a
        href="#innehall"
        className="label sr-only z-50 rounded bg-amber px-4 py-3 text-asphalt focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {dict.a11y.skipToContent}
      </a>
      <StaticStory />
      <BridgeModal />
      <SemanticMirror locale={locale} dict={dict} />
    </I18nProvider>
  );
}
