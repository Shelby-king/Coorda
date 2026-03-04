// getEscrowStatus.cdc
// Script: Query escrow status (read-only, Cadence 1.0)

import EscrowVault from 0xf4112c315b4ed69b

access(all) fun main(contractAddress: Address, escrowId: String): EscrowVault.EscrowStatus? {
    let manager = getAccount(contractAddress)
        .capabilities
        .borrow<&EscrowVault.EscrowManager>(EscrowVault.EscrowManagerPublicPath)
        ?? panic("Could not borrow EscrowManager from address: ".concat(contractAddress.toString()))

    return manager.getEscrowStatus(escrowId: escrowId)
}
