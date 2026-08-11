/**
 * Credential rules, for telling people what is expected *before* they submit.
 *
 * The review app enforces these — this is a description of its rules, not a
 * second implementation of them. If they ever disagree, the server wins and the
 * person sees its message; nothing here can let a bad value through.
 */

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;

export const USERNAME_HINT = `${USERNAME_MIN}–${USERNAME_MAX} characters, with an uppercase letter, a lowercase letter, a number and a symbol.`;

export const PASSWORD_MIN = 10;
