// releaseFunds.cdc
// Transaction: Release locked escrow funds to a recipient (Cadence 1.0)

import FungibleToken from 0x9a0766d93b6608b7
import EscrowVault from 0xf4112c315b4ed69b

transaction(escrowId: String, recipientAddress: Address) {

    let managerRef: &EscrowVault.EscrowManager
    let recipientVault: &{FungibleToken.Receiver}

    prepare(signer: auth(Storage, Capabilities) &Account) {
        self.managerRef = signer.capabilities
            .borrow<&EscrowVault.EscrowManager>(EscrowVault.EscrowManagerPublicPath)
            ?? panic("Could not borrow EscrowManager reference")

        self.recipientVault = getAccount(recipientAddress)
            .capabilities
            .borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
            ?? panic("Could not borrow FlowToken receiver for recipient")
    }

    execute {
        self.managerRef.releaseFunds(
            escrowId: escrowId,
            recipientVault: self.recipientVault,
            recipientAddress: recipientAddress
        )
    }
}
