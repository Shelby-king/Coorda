// EscrowVault.cdc
// Coorda Buildathon Platform — Escrow Vault Contract (Cadence 1.0)
// Handles trustless fund locking, release, and dispute management on Flow.

import "FungibleToken"
import "FlowToken"

access(all) contract EscrowVault {

    // ─── Events ───────────────────────────────────────────────
    access(all) event FundsLocked(escrowId: String, hostAddress: Address, amount: UFix64)
    access(all) event FundsReleased(escrowId: String, recipientAddress: Address, amount: UFix64)
    access(all) event DisputeRaised(escrowId: String, raisedBy: Address, reason: String)
    access(all) event DisputeResolved(escrowId: String, resolvedBy: Address, recipientAddress: Address, amount: UFix64)
    access(all) event EscrowCancelled(escrowId: String, refundedTo: Address, amount: UFix64)
    access(all) event EscrowCreated(escrowId: String, buildathonId: String, hostAddress: Address)

    // ─── Enums ────────────────────────────────────────────────
    access(all) enum EscrowState: UInt8 {
        access(all) case Pending
        access(all) case Locked
        access(all) case Released
        access(all) case Disputed
        access(all) case Resolved
        access(all) case Cancelled
    }

    // ─── Structs ──────────────────────────────────────────────
    access(all) struct EscrowStatus {
        access(all) let escrowId: String
        access(all) let hostAddress: Address
        access(all) let amount: UFix64
        access(all) let state: EscrowState
        access(all) let buildathonId: String
        access(all) let recipientAddress: Address?
        access(all) let disputeReason: String?
        access(all) let createdAt: UFix64

        init(
            escrowId: String,
            hostAddress: Address,
            amount: UFix64,
            state: EscrowState,
            buildathonId: String,
            recipientAddress: Address?,
            disputeReason: String?,
            createdAt: UFix64
        ) {
            self.escrowId = escrowId
            self.hostAddress = hostAddress
            self.amount = amount
            self.state = state
            self.buildathonId = buildathonId
            self.recipientAddress = recipientAddress
            self.disputeReason = disputeReason
            self.createdAt = createdAt
        }
    }

    // ─── Escrow Resource ──────────────────────────────────────
    access(all) resource Escrow {
        access(all) let escrowId: String
        access(all) let hostAddress: Address
        access(all) let buildathonId: String
        access(all) var state: EscrowState
        access(all) var recipientAddress: Address?
        access(all) var disputeReason: String?
        access(all) let createdAt: UFix64
        access(all) var lockedAmount: UFix64

        access(self) var vault: @{FungibleToken.Vault}

        access(all) fun getBalance(): UFix64 {
            return self.lockedAmount
        }

        access(all) fun deposit(from: @{FungibleToken.Vault}) {
            pre {
                self.state == EscrowState.Pending || self.state == EscrowState.Locked:
                    "Cannot deposit into escrow in current state"
            }
            let amount = from.balance
            self.lockedAmount = self.lockedAmount + amount
            self.state = EscrowState.Locked
            self.vault.deposit(from: <- from)
            emit FundsLocked(
                escrowId: self.escrowId,
                hostAddress: self.hostAddress,
                amount: amount
            )
        }

        access(all) fun release(recipientVault: &{FungibleToken.Receiver}, recipientAddress: Address) {
            pre {
                self.state == EscrowState.Locked: "Escrow must be locked to release"
                self.vault.balance > 0.0: "No funds to release"
            }
            let amount = self.lockedAmount
            self.lockedAmount = 0.0
            self.recipientAddress = recipientAddress
            self.state = EscrowState.Released
            let funds <- self.vault.withdraw(amount: amount)
            recipientVault.deposit(from: <- funds)
            emit FundsReleased(
                escrowId: self.escrowId,
                recipientAddress: recipientAddress,
                amount: amount
            )
        }

        access(all) fun raiseDispute(reason: String, raisedBy: Address) {
            pre {
                self.state == EscrowState.Locked: "Can only dispute a locked escrow"
                reason.length > 0: "Dispute reason cannot be empty"
            }
            self.state = EscrowState.Disputed
            self.disputeReason = reason
            emit DisputeRaised(escrowId: self.escrowId, raisedBy: raisedBy, reason: reason)
        }

        access(all) fun resolveDispute(
            mediatorAddress: Address,
            recipientVault: &{FungibleToken.Receiver},
            recipientAddress: Address
        ) {
            pre {
                self.state == EscrowState.Disputed: "Escrow must be in disputed state"
            }
            let amount = self.lockedAmount
            self.lockedAmount = 0.0
            self.recipientAddress = recipientAddress
            self.state = EscrowState.Resolved
            let funds <- self.vault.withdraw(amount: amount)
            recipientVault.deposit(from: <- funds)
            emit DisputeResolved(
                escrowId: self.escrowId,
                resolvedBy: mediatorAddress,
                recipientAddress: recipientAddress,
                amount: amount
            )
        }

        access(all) fun cancel(hostVault: &{FungibleToken.Receiver}) {
            pre {
                self.state == EscrowState.Pending || self.state == EscrowState.Locked:
                    "Cannot cancel escrow in current state"
            }
            let amount = self.lockedAmount
            self.lockedAmount = 0.0
            self.state = EscrowState.Cancelled
            if amount > 0.0 {
                let funds <- self.vault.withdraw(amount: amount)
                hostVault.deposit(from: <- funds)
            }
            emit EscrowCancelled(escrowId: self.escrowId, refundedTo: self.hostAddress, amount: amount)
        }

        access(all) fun getStatus(): EscrowStatus {
            return EscrowStatus(
                escrowId: self.escrowId,
                hostAddress: self.hostAddress,
                amount: self.lockedAmount,
                state: self.state,
                buildathonId: self.buildathonId,
                recipientAddress: self.recipientAddress,
                disputeReason: self.disputeReason,
                createdAt: self.createdAt
            )
        }

        init(escrowId: String, hostAddress: Address, buildathonId: String) {
            self.escrowId = escrowId
            self.hostAddress = hostAddress
            self.buildathonId = buildathonId
            self.state = EscrowState.Pending
            self.recipientAddress = nil
            self.disputeReason = nil
            self.createdAt = getCurrentBlock().timestamp
            self.lockedAmount = 0.0
            self.vault <- FlowToken.createEmptyVault(vaultType: Type<@FlowToken.Vault>())
        }
    }

    // ─── EscrowManager Resource ───────────────────────────────
    access(all) resource EscrowManager {
        access(self) var escrows: @{String: Escrow}

        access(all) fun createEscrow(escrowId: String, hostAddress: Address, buildathonId: String): String {
            pre {
                self.escrows[escrowId] == nil: "Escrow with this ID already exists"
            }
            let escrow <- create Escrow(
                escrowId: escrowId,
                hostAddress: hostAddress,
                buildathonId: buildathonId
            )
            self.escrows[escrowId] <-! escrow
            emit EscrowCreated(escrowId: escrowId, buildathonId: buildathonId, hostAddress: hostAddress)
            return escrowId
        }

        access(all) fun lockFunds(escrowId: String, funds: @{FungibleToken.Vault}) {
            let escrow = &self.escrows[escrowId] as &Escrow?
                ?? panic("Escrow not found: ".concat(escrowId))
            escrow.deposit(from: <- funds)
        }

        access(all) fun releaseFunds(
            escrowId: String,
            recipientVault: &{FungibleToken.Receiver},
            recipientAddress: Address
        ) {
            let escrow = &self.escrows[escrowId] as &Escrow?
                ?? panic("Escrow not found: ".concat(escrowId))
            escrow.release(recipientVault: recipientVault, recipientAddress: recipientAddress)
        }

        access(all) fun mediateDispute(
            escrowId: String,
            mediatorAddress: Address,
            recipientVault: &{FungibleToken.Receiver},
            recipientAddress: Address
        ) {
            let escrow = &self.escrows[escrowId] as &Escrow?
                ?? panic("Escrow not found: ".concat(escrowId))
            escrow.resolveDispute(
                mediatorAddress: mediatorAddress,
                recipientVault: recipientVault,
                recipientAddress: recipientAddress
            )
        }

        access(all) fun raiseDispute(escrowId: String, reason: String, raisedBy: Address) {
            let escrow = &self.escrows[escrowId] as &Escrow?
                ?? panic("Escrow not found: ".concat(escrowId))
            escrow.raiseDispute(reason: reason, raisedBy: raisedBy)
        }

        access(all) fun cancelEscrow(escrowId: String, hostVault: &{FungibleToken.Receiver}) {
            let escrow = &self.escrows[escrowId] as &Escrow?
                ?? panic("Escrow not found: ".concat(escrowId))
            escrow.cancel(hostVault: hostVault)
        }

        access(all) fun getEscrowStatus(escrowId: String): EscrowStatus? {
            let escrow = &self.escrows[escrowId] as &Escrow?
            return escrow?.getStatus()
        }

        access(all) fun getBalance(escrowId: String): UFix64? {
            let escrow = &self.escrows[escrowId] as &Escrow?
            return escrow?.getBalance()
        }

        init() {
            self.escrows <- {}
        }
    }

    // ─── Storage paths ────────────────────────────────────────
    access(all) let EscrowManagerStoragePath: StoragePath
    access(all) let EscrowManagerPublicPath: PublicPath

    // ─── Contract init ────────────────────────────────────────
    init() {
        self.EscrowManagerStoragePath = /storage/CoordeEscrowManager
        self.EscrowManagerPublicPath = /public/CoordeEscrowManager

        let manager <- create EscrowManager()
        self.account.storage.save(<- manager, to: self.EscrowManagerStoragePath)

        let cap = self.account.capabilities.storage.issue<&EscrowManager>(self.EscrowManagerStoragePath)
        self.account.capabilities.publish(cap, at: self.EscrowManagerPublicPath)
    }
}
