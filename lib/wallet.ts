// ETH wallet connection + ENS resolution (browser-only)

export async function connectWallet(): Promise<string | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eth = (window as any).ethereum;
    if (!eth) return null;
    const accounts: string[] = await eth.request({ method: 'eth_requestAccounts' });
    return accounts[0]?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}

export async function getWalletDisplayName(address: string): Promise<string> {
  try {
    const res = await fetch(`https://api-hazel-pi-72.vercel.app/api/wallet/${address}`);
    if (res.ok) {
      const data = await res.json();
      if (data.ens) return data.ens;
    }
  } catch { /* fall through */ }
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function getSavedWallet(): string | null {
  try { return localStorage.getItem('btd_wallet'); } catch { return null; }
}

export function saveWallet(address: string): void {
  try { localStorage.setItem('btd_wallet', address); } catch { /* noop */ }
}
