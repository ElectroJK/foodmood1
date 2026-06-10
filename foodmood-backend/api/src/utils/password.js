import bcrypt from 'bcryptjs';

// 12 rounds — matches the value stated in the diploma report (~250ms hash on a
// modern laptop, ~4000× harder to brute-force than the bcrypt default of 10).
const SALT_ROUNDS = 12;

export function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}
