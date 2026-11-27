import type { ProviderInfo } from "@/lib/providers";

const STYLE = {
  letter: ["border-emerald-200 bg-emerald-50 text-emerald-900", "✅ Kündigung per Brief möglich"],
  check: ["border-amber-200 bg-amber-50 text-amber-900", "⚠️ Kündigungsweg vorab prüfen"],
  "no-letter": ["border-red-200 bg-red-50 text-red-900", "⛔ Brief wird laut Anbieter nicht akzeptiert"],
} as const;

export function ChannelNotice({ provider, compact = false }: { provider: Pick<ProviderInfo, "channel" | "channelNote">; compact?: boolean }) {
  const [cls, title] = STYLE[provider.channel];
  if (compact) return <p className={`rounded-md border px-2 py-1 text-xs ${cls}`}>{title}: {provider.channelNote}</p>;
  return (
    <div className={`rounded-lg border p-3 text-sm ${cls}`} data-channel={provider.channel}>
      <p className="font-semibold">{title}</p>
      <p>{provider.channelNote}</p>
    </div>
  );
}
