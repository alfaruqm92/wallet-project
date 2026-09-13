export function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID").format(value ?? 0);
}

export function formatDate(isoString) {
  if (!isoString) return "";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoString));
}
