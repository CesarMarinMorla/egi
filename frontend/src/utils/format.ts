export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR')
}
