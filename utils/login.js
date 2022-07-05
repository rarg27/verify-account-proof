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

  console.log(fcl.current)

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

  let insideSigners = findInsideSigners(ix)
  const outsidePayload = sdk.encodeTransactionEnvelope({
    ...prepForEncoding(ix),
    payloadSigs: insideSigners.map(id => ({
      address: ix.accounts[id].addr,
      keyId: ix.accounts[id].keyId,
      sig: ix.accounts[id].signature,
    })),
  })

  console.log(outsidePayload)

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

function findInsideSigners(ix) {
  // Inside Signers Are: (authorizers + proposer) - payer
  let inside = new Set(ix.authorizations)
  inside.add(ix.proposer)
  if (Array.isArray(ix.payer)) {
    ix.payer.forEach(p => inside.delete(p));
  } else {
    inside.delete(ix.payer)
  }
  return Array.from(inside)
}