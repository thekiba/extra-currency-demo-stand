import { TonClient4, Address, loadTransaction } from '@ton/ton';

type Network = 'mainnet' | 'testnet';

const NETWORK: Network = 'testnet' as Network;

const TON_CLIENT_ENDPOINT = 
  NETWORK === 'mainnet'
    ? 'https://mainnet-v4.tonhubapi.com'
    : 'https://testnet-v4.tonhubapi.com';

export function getTonClient() {
  return new TonClient4({ endpoint: TON_CLIENT_ENDPOINT });
}

export async function getAccountState(address: Address) {
  const client = getTonClient();
  const masterAt = await client.getLastBlock();
  const account = await client.getAccount(masterAt.last.seqno, address);
  return account;
}

export async function getLastAccountTransactions(address: Address) {
  const client = getTonClient();
  const masterAt = await client.getLastBlock();
  const account = await client.getAccount(masterAt.last.seqno, address);
  if (!account.account.last) {
    return [];
  }

  const lt = BigInt(account.account.last.lt);
  const hash = Buffer.from(account.account.last.hash, 'base64');
  const rawTransactions = await client.getAccountTransactions(address, lt, hash);
  const transactions = rawTransactions.map(tx => loadTransaction(tx.tx.raw.beginParse()));

  return transactions;
}
