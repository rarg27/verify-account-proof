import NFTStorefront from 0x94b06cfca1d8a476
import DapperUtilityCoin from 0x82ec283f88a62e65
import NonFungibleToken from 0x631e88ae7f1d7c20
import FungibleToken from 0x9a0766d93b6608b7
import Ded from 0xc2f38d781b695d66

// This transcation initializes an account with a collection that allows it to hold NFTs from a specific contract. It will
// do nothing if the account is already initialized.
transaction {
    prepare(collector: AuthAccount) {
        if collector.borrow<&Ded.Collection>(from: Ded.CollectionStoragePath) == nil {
            let collection <- Ded.createEmptyCollection() as! @Ded.Collection
            collector.save(<-collection, to: Ded.CollectionStoragePath)
            collector.link<&Ded.Collection{NonFungibleToken.CollectionPublic, Ded.DedCollectionPublic}>(
                Ded.CollectionPublicPath,
                target: Ded.CollectionStoragePath,
            )
        }
    }
}