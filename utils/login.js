import * as fcl from "@onflow/fcl"
import * as sdk from "@onflow/sdk"
import { config } from "@onflow/config"
import { sansPrefix } from "@onflow/util-address"
import INIT_ACCOUNT_CDC from "./init_account.cdc"

const txScript = sdk.transaction`${INIT_ACCOUNT_CDC}`

export async function login() {
  let res = await fcl.authenticate()

  // const txId = await fcl.mutate({
  //   cadence: INIT_ACCOUNT_CDC,
  //   limit: 1000,
  // })

  const authz = await sdk.config().get("fcl.authz", fcl.currentUser().authorization)
  // const node = await config().get("accessNode.api")

  const ix = await sdk.resolve(await sdk.build([
    sdk.transaction(INIT_ACCOUNT_CDC),
    sdk.limit(1000),
    sdk.proposer(authz),
    sdk.payer(authz),
    sdk.authorizations([authz]),
  ]))

  console.log(ix)

  let insidePayload = sdk.encodeTransactionPayload(prepForEncoding(ix))
  insidePayload = insidePayload.slice(64, insidePayload.length)
  console.log(insidePayload)

  const query = `
pub fun main(
    address: Address,
    message: String,
    keyIndices: [Int],
    signatures: [String],
    domainSeparationTag: String,
): Int {
    pre {
        keyIndices.length == signatures.length : "Key index list length does not match signature list length"
    }

    let account = getAccount(address)
    let messageBytes = message.decodeHex()

    var totalWeight: UFix64 = 0.0
    let seenKeyIndices: {Int: Bool} = {}

    var i = 0

    for keyIndex in keyIndices {

        let accountKey = account.keys.get(keyIndex: keyIndex) ?? panic("Key provided does not exist on account")
        let signature = signatures[i].decodeHex()

        // Ensure this key index has not already been seen

        if seenKeyIndices[accountKey.keyIndex] ?? false {
            return 1
        }

        // Record the key index was seen

        seenKeyIndices[accountKey.keyIndex] = true

        // Ensure the key is not revoked

        if accountKey.isRevoked {
            return 2
        }

        // Ensure the signature is valid

        if !accountKey.publicKey.verify(
            signature: signature,
            signedData: messageBytes,
            domainSeparationTag: domainSeparationTag,
            hashAlgorithm: accountKey.hashAlgorithm
        ) {
            return 3
        }

        totalWeight = totalWeight + accountKey.weight

        i = i + 1
    }
    
    return totalWeight >= 1000.0 ? 4 : 5
}
`

  const user = await fcl.currentUser().snapshot()
  const address = user.addr
  const message = insidePayload
  const keyIndices = [ix.accounts[ix.proposer].keyId]
  const signaturesArr = [ix.accounts[ix.proposer].signature]
  const domainSeparationTag = "FLOW-V0.0-transaction"

  const response = await fcl.query({
    cadence: query,
    args: (arg, t) => [
      arg(address, t.Address),
      arg(message, t.String),
      arg(keyIndices, t.Array([t.Int])),
      arg(signaturesArr, t.Array([t.String])),
      arg(domainSeparationTag, t.String),
    ],
  })

  console.log(response)

  // const builtInteraction = await sdk.build([
  //     sdk.transaction(INIT_ACCOUNT_CDC),
  //     sdk.payer(authz),
  //     sdk.proposer(authz),
  //     sdk.authorizations([authz]),
  //     sdk.limit(1000)
  // ])
  // console.log(builtInteraction)

  // var resolvedInteraction = await sdk.pipe(builtInteraction, [
  //   sdk.resolveArguments,
  //   sdk.resolveParams,
  //   sdk.resolveAccounts,
  //   sdk.resolveCadence,
  //   sdk.resolveRefBlockId({ node: node }),
  //   sdk.resolveProposerSequenceNumber({ node: node }),
  //   sdk.resolveSignatures,
  // ])
  // console.log(resolvedInteraction)

  // resolvedInteraction = await sdk.resolveSignatures(resolvedInteraction)
  // console.log(resolvedInteraction)

  // const response = await sdk.send(resolvedInteraction, { node: await config().get("accessNode.api") })
  // console.log(response)

  // const accountProofService = res.services.find(services => services.type === 'account-proof');

  // if (accountProofService) {
  //   const response = await fetch('http://127.0.0.1:8000/api/signin', {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //       'Accept': 'application/json'
  //     },
  //     body: JSON.stringify({ 'account-proof': accountProofService.data })
  //   })

  //   const verified = await response.json();
  //   console.log(verified);
  // }
}

function prepForEncoding(ix) {
  const payerAddress = sansPrefix((Array.isArray(ix.payer) 
  ? ix.accounts[ix.payer[0]]
  : ix.accounts[ix.payer]).addr);
  return {
    cadence: ix.message.cadence,
    refBlock: ix.message.refBlock || null,
    computeLimit: ix.message.computeLimit,
    arguments: ix.message.arguments.map(id => ix.arguments[id].asArgument),
    proposalKey: {
      address: sansPrefix(ix.accounts[ix.proposer].addr),
      keyId: ix.accounts[ix.proposer].keyId,
      sequenceNum: ix.accounts[ix.proposer].sequenceNum,
    },
    payer: payerAddress,
    authorizers: ix.authorizations
      .map(cid => sansPrefix(ix.accounts[cid].addr))
      .reduce((prev, current) => {
        return prev.find(item => item === current) ? prev : [...prev, current]
      }, []),
  }
}
