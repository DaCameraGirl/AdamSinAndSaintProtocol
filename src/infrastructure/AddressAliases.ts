export const ADDRESS_ALIASES: Record<string, { label: string; type: string }> = {
  "0x0000000000000000000000000000000000000000": { label: "Zero Address (burn/null)", type: "burn" },
  "0x000000000000000000000000000000000000dead": { label: "Dead Address (burn)", type: "burn" },
  "0x0000000000000000000000000000000000000001": { label: "Parity Burn", type: "burn" },
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": { label: "WETH Contract", type: "contract" },
  "0x7a250d5630b4cf539739df2c5dacb4c659f2488d": { label: "Uniswap V2 Router", type: "dex" },
  "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45": { label: "Uniswap V3 Router", type: "dex" },
  "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD": { label: "Uniswap Universal Router", type: "dex" },
  "0xdef1c0ded9bec7f1a1670819833240f027b25eff": { label: "0x Exchange Proxy", type: "dex" },
  "0x1111111254fb6c44bac0bed2854e76f90643097d": { label: "1inch Router V5", type: "dex" },
  "0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f": { label: "SushiSwap Router", type: "dex" },
  "0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9": { label: "Aave V2 LendingPool", type: "lending" },
  "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2": { label: "Aave V3 Pool", type: "lending" },
  "0xdAC17F958D2ee523a2206206994597C13D831ec7": { label: "USDT Contract", type: "token" },
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48": { label: "USDC Contract", type: "token" },
  "0x6B175474E89094C44Da98b954EedeAC495271d0F": { label: "DAI Contract", type: "token" },
  "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599": { label: "WBTC Contract", type: "token" },
  "0x514910771AF9Ca656af840dff83E8264EcF986CA": { label: "LINK Contract", type: "token" },
  "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa": { label: "Genesis Coinbase (Satoshi)", type: "historical" },
  "1KFHE7w8BhaENAswwryaoccDb6qcT6DbE4": { label: "Binance Cold Wallet", type: "exchange" },
  "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy": { label: "Bitfinex Cold Wallet", type: "exchange" }
};

export function resolveAddress(addr: string | undefined): string {
  if (!addr) return "Unknown";
  const cleaned = addr.toLowerCase();
  const match = ADDRESS_ALIASES[cleaned] || ADDRESS_ALIASES[addr];
  if (match) return `${match.label} (${match.type})`;
  return addr;
}
