/**
 * The signed-in user, shared by every component that needs it.
 *
 * `/api/auth/verify` is called once per page load and the result is cached at
 * module level, so the header, the side nav and the page they wrap do not each
 * hit the endpoint. Call `refreshCurrentUser()` after changing anything the
 * session reports (clinic name, Stedi mode): it re-verifies and pushes the new
 * user into every mounted `useCurrentUser()`.
 */
import { useEffect, useState } from 'react';

/** Clinic the user signs in under, as summarised by the auth endpoints. */
export interface CurrentUserAccount {
  id: string;
  name: string;
  npiNumber?: string | null;
  taxId?: string | null;
  phoneNumber?: string | null;
  city?: string | null;
  state?: string | null;
  status?: string | null;
}

export interface CurrentUser {
  id: string;
  email: string;
  username: string;
  role: string;
  stediMode?: string;
  accountId?: string | null;
  account?: CurrentUserAccount | null;
  providerId?: string | null;
  provider?: { id?: string; name: string; npiNumber?: string } | null;
}

let pending: Promise<CurrentUser | null> | null = null;
const subscribers = new Set<(user: CurrentUser | null) => void>();

/** Resolves to the signed-in user, or null when the session is not valid. */
export function fetchCurrentUser(): Promise<CurrentUser | null> {
  if (!pending) {
    pending = fetch('/api/auth/verify', { credentials: 'include' })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => (data?.user as CurrentUser) ?? null)
      .catch(() => null);
  }
  return pending;
}

/** Re-verifies the session and hands the result to every mounted consumer. */
export function refreshCurrentUser(): Promise<CurrentUser | null> {
  pending = null;
  return fetchCurrentUser().then((user) => {
    subscribers.forEach((notify) => notify(user));
    return user;
  });
}

export function useCurrentUser(): { user: CurrentUser | null; isLoading: boolean } {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const receive = (result: CurrentUser | null) => {
      if (!active) return;
      setUser(result);
      setIsLoading(false);
    };

    subscribers.add(receive);
    fetchCurrentUser().then(receive);

    return () => {
      active = false;
      subscribers.delete(receive);
    };
  }, []);

  return { user, isLoading };
}
