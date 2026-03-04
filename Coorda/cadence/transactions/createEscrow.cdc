// createEscrow.cdc
// Transaction: Create a new escrow entry and lock FLOW tokens (Cadence 1.0)

import FungibleToken from 0x9a0766d93b6608b7
import FlowToken from 0x7e60df042a9c0868
import EscrowVault from 0xf4112c315b4ed69b

transaction(escrowId: String, buildathonId: String, amount: UFix64) {

    let hostAddress: Address
    let managerRef: &EscrowVault.EscrowManager
    let paymentVault: @{FungibleToken.Vault}

    prepare(signer: auth(Storage, Capabilities) &Account) {
        self.hostAddress = signer.address

        self.managerRef = signer.capabilities
            .borrow<&EscrowVault.EscrowManager>(EscrowVault.EscrowManagerPublicPath)
            ?? panic("Could not borrow EscrowManager — has the contract been deployed to this account?")

        let flowVault = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
            from: /storage/flowTokenVault
        ) ?? panic("Could not borrow FlowToken vault from signer storage")

        self.paymentVault <- flowVault.withdraw(amount: amount)
    }

    execute {
        self.managerRef.createEscrow(
            escrowId: escrowId,
            hostAddress: self.hostAddress,
            buildathonId: buildathonId
        )
        self.managerRef.lockFunds(escrowId: escrowId, funds: <- self.paymentVault)
    }
}
