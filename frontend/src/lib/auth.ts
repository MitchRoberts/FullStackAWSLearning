// src/lib/auth.ts
import { Amplify } from "aws-amplify";
import {
  signUp, confirmSignUp, signIn, signOut,
  fetchAuthSession, getCurrentUser
} from "aws-amplify/auth";

const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
const userPoolClientId = import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID;

// ✅ guard with a loud error if missing
if (!userPoolId || !userPoolClientId) {
  console.error("Cognito env missing", { userPoolId, userPoolClientId });
  throw new Error("Missing VITE_COGNITO_USER_POOL_ID or VITE_COGNITO_USER_POOL_CLIENT_ID");
}

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId,
      userPoolClientId,
      signUpVerificationMethod: "code",
      // optional:
      // loginWith: { email: true, username: false, phone: false },
    },
  },
});

// exports
export const doSignUp   = (email: string, password: string) =>
  signUp({ username: email, password, options: { userAttributes: { email } } });

export const doConfirm  = (email: string, code: string) =>
  confirmSignUp({ username: email, confirmationCode: code });

export const doSignIn   = (email: string, password: string) =>
  signIn({ username: email, password });

export const doSignOut  = () => signOut();

export async function sessionToken(): Promise<string | null> {
  const { tokens } = await fetchAuthSession();
  return tokens?.idToken?.toString() ?? null;
}

export async function whoAmI() {
  try { return await getCurrentUser(); } catch { return null; }
}
