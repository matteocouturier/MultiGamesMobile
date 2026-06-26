/** Room code generation: 6 uppercase letters, avoiding ambiguous characters. */

// No I/O (vowels kept but ambiguous letters removed where helpful).
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I, O to avoid confusion with 1/0

export function generateRoomCode(isTaken: (code: string) => boolean): string {
  for (let attempt = 0; attempt < 50; attempt++) {
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    }
    if (!isTaken(code)) return code;
  }
  throw new Error('Could not allocate a unique room code');
}
