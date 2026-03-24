// Character set excludes ambiguous chars: 0, O, I, L, 1
const CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 5;
const PREFIX = 'HMD';

export function generateInviteCode(): string {
  const chars = Array.from({ length: CODE_LENGTH }, () =>
    CHARSET[Math.floor(Math.random() * CHARSET.length)],
  ).join('');
  return `${PREFIX}-${chars}`;
}

export const INVITE_CODE_PATTERN = /^HMD-[A-HJ-NP-Z2-9]{5}$/;
