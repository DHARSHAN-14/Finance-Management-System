export function generateUserCode(role: string) {
  const prefix = role === 'ADMIN' ? 'ADM' : role === 'STAFF' ? 'STA' : 'CUS';
  return generateCode(prefix);
}

export function generateCustomerCode() {
  return generateCode('CUS');
}

function generateCode(prefix: string) {
  // Human-friendly, highly-unique (no DB counter needed)
  const time = Date.now().toString(36).toUpperCase();
  const rand = Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0');
  return `${prefix}-${time}-${rand}`;
}

