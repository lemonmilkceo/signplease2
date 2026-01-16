/**
 * Deep Linking & Deferred Redirection Utility
 * Stores the target URL when an unauthenticated user tries to access a protected resource.
 */

const REDIRECT_PATH_KEY = "signplease_redirect_path";

/**
 * Save the current path to localStorage for later redirection after login/signup.
 */
export function saveRedirectPath(path: string) {
    if (!path || path === "/" || path === "/login" || path === "/signup") return;
    localStorage.setItem(REDIRECT_PATH_KEY, path);
}

/**
 * Get and clear the saved redirect path.
 */
export function popRedirectPath(): string | null {
    const path = localStorage.getItem(REDIRECT_PATH_KEY);
    localStorage.removeItem(REDIRECT_PATH_KEY);
    return path;
}

/**
 * Check if there is a saved redirect path.
 */
export function hasRedirectPath(): boolean {
    return !!localStorage.getItem(REDIRECT_PATH_KEY);
}

/**
 * Generate a full sharing URL for a contract.
 */
export function getContractShareUrl(contractId: string): string {
    return `${window.location.origin}/worker/contract/${contractId}`;
}
