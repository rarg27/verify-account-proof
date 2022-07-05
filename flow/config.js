import * as fcl from "@onflow/fcl";

const resolver = async () => {
  const response = await fetch('http://127.0.0.1:8000/api/nonce/generate');
  const data = await response.json();
  return data.data;
}

fcl.config()
  // BLOCTO
  // .put("accessNode.api", "https://rest-testnet.onflow.org")
  // .put("discovery.wallet", "https://fcl-discovery.onflow.org/testnet/authn")
  // DAPPER
  .put("accessNode.api", "https://rest-testnet.onflow.org")
  .put("discovery.wallet", "https://staging.accounts.meetdapper.com/fcl/authn-restricted")
  .put("discovery.wallet.method", "POP/RPC")
  .put("fcl.accountProof.resolver", resolver)
  .put("env", "testnet")
