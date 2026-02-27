/**
 * Convierte un precio en formato "$X,XXX" o "$X,XXX – $Y,YYY" a centavos
 * Si hay un rango, toma el valor mínimo
 */
export function parsePriceToCents(priceStr: string): number {
  // Remover "$" y espacios, tomar el primer número
  const match = priceStr.match(/\$?([\d,]+)/);
  if (!match) return 0;
  
  // Remover comas y convertir a número
  const numberStr = match[1].replace(/,/g, '');
  const dollars = parseInt(numberStr, 10);
  
  // Convertir a centavos (MXN)
  return dollars * 100;
}

/**
 * Formatea centavos a formato de moneda
 */
export function formatCentsToCurrency(cents: number, currency: string = 'MXN'): string {
  const amount = cents / 100;
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
