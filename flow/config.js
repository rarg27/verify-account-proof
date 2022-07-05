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
const address = "0xce37ac67a684aa09"
const message = "f9046cf903dbb90395696d706f7274204e465453746f726566726f6e742066726f6d203078393462303663666361316438613437360a696d706f7274204461707065725574696c697479436f696e2066726f6d203078383265633238336638386136326536350a696d706f7274204e6f6e46756e6769626c65546f6b656e2066726f6d203078363331653838616537663164376332300a696d706f72742046756e6769626c65546f6b656e2066726f6d203078396130373636643933623636303862370a696d706f7274204465642066726f6d203078633266333864373831623639356436360a0a2f2f2054686973207472616e73636174696f6e20696e697469616c697a657320616e206163636f756e742077697468206120636f6c6c656374696f6e207468617420616c6c6f777320697420746f20686f6c64204e4654732066726f6d206120737065636966696320636f6e74726163742e2049742077696c6c0a2f2f20646f206e6f7468696e6720696620746865206163636f756e7420697320616c726561647920696e697469616c697a65642e0a7472616e73616374696f6e207b0a202020207072657061726528636f6c6c6563746f723a20417574684163636f756e7429207b0a2020202020202020696620636f6c6c6563746f722e626f72726f773c264465642e436f6c6c656374696f6e3e2866726f6d3a204465642e436f6c6c656374696f6e53746f726167655061746829203d3d206e696c207b0a2020202020202020202020206c657420636f6c6c656374696f6e203c2d204465642e637265617465456d707479436f6c6c656374696f6e28292061732120404465642e436f6c6c656374696f6e0a202020202020202020202020636f6c6c6563746f722e73617665283c2d636f6c6c656374696f6e2c20746f3a204465642e436f6c6c656374696f6e53746f7261676550617468290a202020202020202020202020636f6c6c6563746f722e6c696e6b3c264465642e436f6c6c656374696f6e7b4e6f6e46756e6769626c65546f6b656e2e436f6c6c656374696f6e5075626c69632c204465642e446564436f6c6c656374696f6e5075626c69637d3e280a202020202020202020202020202020204465642e436f6c6c656374696f6e5075626c6963506174682c0a202020202020202020202020202020207461726765743a204465642e436f6c6c656374696f6e53746f72616765506174682c0a202020202020202020202020290a20202020202020207d0a202020207d0a7dc0a0c3578629d7c7f202160a0e78b8d0bacb64b9507a11c9661f4d2b9401604d2fe98203e888ce37ac67a684aa090a0188668b91e2995c2ebac988ce37ac67a684aa09f88cf8448080b84055622033c6bf895001c638087ffeb901fa57a4d9549f6892224ecb5ba7351f2fd39118528826f4934f013959da172e57315f514e923221488cf451189b561b44f844800ab8401533e63f6c5f553e3a97070ee9c4b6cffc856d3acd9c481cb96593d0cb1e6566631c6d719f9c161d887c1ba928ed4b8eceeb4bbb200889fdae25c2d4027cab8d"
const keyIndices = ["10"]
const signaturesArr = ["1533e63f6c5f553e3a97070ee9c4b6cffc856d3acd9c481cb96593d0cb1e6566631c6d719f9c161d887c1ba928ed4b8eceeb4bbb200889fdae25c2d4027cab8d"]
const domainSeparationTag = "FLOW-V0.0-transaction"

const qweqwe = async () => {
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
}

qweqwe()