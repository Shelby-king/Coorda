// cancelEscrow.cdc
// Transaction: Host cancels an escrow and receives a refund (Cadence 1.0)

import FungibleToken from 0x9a0766d93b6608b7
import EscrowVault from 0xf4112c315b4ed69b

transaction(escrowId: String) {

    let managerRef: &EscrowVault.EscrowManager
    let hostVault: &{FungibleToken.Receiver}

    prepare(signer: auth(Storage, Capabilities) &Account) {
        self.managerRef = signer.capabilities
            .borrow<&EscrowVault.EscrowManager>(EscrowVault.EscrowManagerPublicPath)
            ?? panic("Could not borrow EscrowManager reference")

        self.hostVault = signer.capabilities
            .borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
            ?? panic("Could not borrow FlowToken receiver for host")
    }

    execute {
        self.managerRef.cancelEscrow(escrowId: escrowId, hostVault: self.hostVault)
    }
}
