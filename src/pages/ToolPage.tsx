import { Suspense, lazy, type ComponentType, type LazyExoticComponent } from "react";
import { ArrowLeft, Hourglass } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toneClasses, tools } from "../config/tools";

const toolComponents = new Map<string, LazyExoticComponent<ComponentType>>(
  tools.flatMap((tool) => (tool.load ? [[tool.id, lazy(tool.load)] as const] : []))
);

export default function ToolPage() {
  const { toolId } = useParams();
  const { t } = useTranslation();
  const tool = tools.find((item) => item.id === toolId);

  if (!tool) {
    return (
      <div className="py-20 text-center">
        <h1 className="font-mono text-2xl font-semibold">404</h1>
        <Link to="/dashboard" className="mt-4 inline-flex items-center gap-2 font-mono text-sm underline underline-offset-4">
          <ArrowLeft size={15} />
          {t("back")}
        </Link>
      </div>
    );
  }

  const Icon = tool.icon;
  const Content = toolComponents.get(tool.id);

  return (
    <div className="space-y-8">
      <Link to="/dashboard" className="inline-flex items-center gap-2 font-mono text-sm text-muted hover:text-foreground">
        <ArrowLeft size={15} />
        {t("back")}
      </Link>
      <header className="flex items-start gap-4">
        <span className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${toneClasses[tool.tone]}`}>
          <Icon size={24} strokeWidth={1.7} />
        </span>
        <div>
          <p className="font-mono text-xs text-muted">{t(`category.${tool.category}`)}</p>
          <h1 className="mt-1 font-mono text-3xl font-semibold tracking-tight">{t(`tools.${tool.key}.name`)}</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">{t(`tools.${tool.key}.description`)}</p>
        </div>
      </header>
      {Content ? (
        <Suspense fallback={<div className="h-48 rounded-2xl border border-border bg-elevated" aria-busy="true" />}>
          <Content />
        </Suspense>
      ) : (
        <div className="flex max-w-2xl gap-3 rounded-2xl border border-border bg-elevated p-4">
          <Hourglass size={18} className="mt-0.5 shrink-0 text-muted" />
          <div>
            <p className="font-mono text-sm font-medium">{t("coming")}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">{t("comingDescription")}</p>
          </div>
        </div>
      )}
    </div>
  );
}
