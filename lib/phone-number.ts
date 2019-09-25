export type PhoneNumber = string[11];

function isPhoneNumber(value: any): value is PhoneNumber {
  return typeof value === 'string' && value.length === 11 && value[0] === '8';
}

function ensurePhoneNumber(value: any): PhoneNumber | null {
  return isPhoneNumber(value) ? value : null;
}

export function parsePhoneNumber(text: string): PhoneNumber | null {
  let regex = text.match(/(\+?7|8)(\d{10})/);
  if (regex) {
    return ensurePhoneNumber(`8${regex[2]}`);
  }
  regex = text.match(/(\+?7|8)([\d\s\-\(\)\.]+)/);
  if (regex) {
    return ensurePhoneNumber(`8${regex[2].replace(/[^\d]/g, '')}`);
  }
  return null;
}
