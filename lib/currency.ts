const maximumPriceCents = 999_999_999;

export function parseBrlToCents(value: unknown): number | null {
  const raw = String(value ?? "").trim().replace(/^R\$\s*/i, "").replace(/\s/g, "");
  if (!raw) return null;

  const normalized = raw.includes(",")
    ? raw.replace(/\./g, "").replace(",", ".")
    : /^\d{1,3}(?:\.\d{3})+$/.test(raw)
      ? raw.replace(/\./g, "")
      : raw;

  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return -1;
  const cents = Math.round(Number(normalized) * 100);
  return Number.isSafeInteger(cents) && cents <= maximumPriceCents ? cents : -1;
}

export function formatBrlFromCents(value: number | null | undefined) {
  if (value == null) return "Sob consulta";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
}

export function formatCentsForInput(value: number | null | undefined) {
  if (value == null) return "";
  return (value / 100).toFixed(2).replace(".", ",");
}
