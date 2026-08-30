const NUMBERS = '0123456789';

export function generateUserNumber(): string {
  let out = '';
  for (let i = 0; i < 5; i++) {
    out += NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
  }
  return out;
}
