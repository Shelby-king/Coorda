// raiseDispute.cdc
// Transaction: Raise a dispute on a locked escrow (Cadence 1.0)

import EscrowVault from 0xf4112c315b4ed69b

transaction(escrowId: String, reason: String) {

    let managerRef: &EscrowVault.EscrowManager
    let callerAddress: Address

    prepare(signer: auth(Storage, Capabilities) &Account) {
        self.callerAddress = signer.address

        self.managerRef = signer.capabilities
            .borrow<&EscrowVault.EscrowManager>(EscrowVault.EscrowManagerPublicPath)
            ?? panic("Could not borrow EscrowManager reference")
    }

    execute {
        self.managerRef.raiseDispute(
            escrowId: escrowId,
            reason: reason,
            raisedBy: self.callerAddress
        )
    }
}
