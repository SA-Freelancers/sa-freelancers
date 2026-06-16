export function formatDate(date?: string | null) {
  if (!date) return "";

  return new Date(date).toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(date?: string | null) {
  if (!date) return "";

  return new Date(date).toLocaleString("en-ZA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}