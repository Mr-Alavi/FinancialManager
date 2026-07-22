export function formatCurrency(amount) {
  if (isNaN(amount)) return '۰ تومان';
  return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
}

export function validateJSON(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error('فایل JSON نامعتبر است');
  }
}
