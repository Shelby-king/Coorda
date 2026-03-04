// WaveManager.cdc
// Coorda Buildathon Platform — Wave Management Contract (Cadence 1.0)
// Manages hackathon waves, builder enrollment, and capacity enforcement.

access(all) contract WaveManager {

    // ─── Events ───────────────────────────────────────────────
    access(all) event WaveCreated(waveId: String, buildathonId: String, hostAddress: Address, maxBuilders: UInt64)
    access(all) event BuilderJoined(waveId: String, builderAddress: Address, currentCount: UInt64)
    access(all) event BuilderRemoved(waveId: String, builderAddress: Address)
    access(all) event WaveStatusChanged(waveId: String, newStatus: String)
    access(all) event SubmissionAdded(waveId: String, builderAddress: Address, submissionId: String)

    // ─── Structs ──────────────────────────────────────────────
    access(all) struct WaveInfo {
        access(all) let waveId: String
        access(all) let buildathonId: String
        access(all) let hostAddress: Address
        access(all) let name: String
        access(all) let maxBuilders: UInt64
        access(all) let currentBuilderCount: UInt64
        access(all) let status: String
        access(all) let prizeAmount: UFix64
        access(all) let createdAt: UFix64
        access(all) let deadline: UFix64?

        init(
            waveId: String,
            buildathonId: String,
            hostAddress: Address,
            name: String,
            maxBuilders: UInt64,
            currentBuilderCount: UInt64,
            status: String,
            prizeAmount: UFix64,
            createdAt: UFix64,
            deadline: UFix64?
        ) {
            self.waveId = waveId
            self.buildathonId = buildathonId
            self.hostAddress = hostAddress
            self.name = name
            self.maxBuilders = maxBuilders
            self.currentBuilderCount = currentBuilderCount
            self.status = status
            self.prizeAmount = prizeAmount
            self.createdAt = createdAt
            self.deadline = deadline
        }
    }

    // ─── Wave Resource ────────────────────────────────────────
    access(all) resource Wave {
        access(all) let waveId: String
        access(all) let buildathonId: String
        access(all) let hostAddress: Address
        access(all) let name: String
        access(all) let maxBuilders: UInt64
        access(all) var status: String
        access(all) let prizeAmount: UFix64
        access(all) let createdAt: UFix64
        access(all) var deadline: UFix64?

        access(self) var builders: {Address: Bool}
        access(self) var submissions: {Address: String}
        access(all) var builderCount: UInt64

        access(all) fun getBuilderCount(): UInt64 {
            return self.builderCount
        }

        access(all) fun hasBuilder(address: Address): Bool {
            return self.builders[address] ?? false
        }

        access(all) fun isAtCapacity(): Bool {
            return self.builderCount >= self.maxBuilders
        }

        access(all) fun join(builderAddress: Address) {
            pre {
                self.status == "open": "Wave is not open for joining"
                self.builderCount < self.maxBuilders: "Wave is at full capacity"
                !(self.builders[builderAddress] ?? false): "Builder already joined this wave"
            }
            self.builders[builderAddress] = true
            self.builderCount = self.builderCount + 1
            emit BuilderJoined(waveId: self.waveId, builderAddress: builderAddress, currentCount: self.builderCount)

            if self.builderCount >= self.maxBuilders {
                self.status = "full"
                emit WaveStatusChanged(waveId: self.waveId, newStatus: "full")
            }
        }

        access(all) fun removeBuilder(builderAddress: Address) {
            pre {
                self.builders[builderAddress] != nil: "Builder not in this wave"
            }
            self.builders.remove(key: builderAddress)
            self.builderCount = self.builderCount - 1
            if self.status == "full" {
                self.status = "open"
                emit WaveStatusChanged(waveId: self.waveId, newStatus: "open")
            }
            emit BuilderRemoved(waveId: self.waveId, builderAddress: builderAddress)
        }

        access(all) fun addSubmission(builderAddress: Address, submissionId: String) {
            pre {
                self.builders[builderAddress] ?? false: "Builder must be in wave to submit"
                self.status == "open" || self.status == "full": "Wave must be open or full to accept submissions"
            }
            self.submissions[builderAddress] = submissionId
            emit SubmissionAdded(waveId: self.waveId, builderAddress: builderAddress, submissionId: submissionId)
        }

        access(all) fun updateStatus(newStatus: String) {
            pre {
                newStatus == "open" || newStatus == "closed" || newStatus == "completed":
                    "Invalid status. Must be open, closed, or completed"
            }
            self.status = newStatus
            emit WaveStatusChanged(waveId: self.waveId, newStatus: newStatus)
        }

        access(all) fun getInfo(): WaveInfo {
            return WaveInfo(
                waveId: self.waveId,
                buildathonId: self.buildathonId,
                hostAddress: self.hostAddress,
                name: self.name,
                maxBuilders: self.maxBuilders,
                currentBuilderCount: self.builderCount,
                status: self.status,
                prizeAmount: self.prizeAmount,
                createdAt: self.createdAt,
                deadline: self.deadline
            )
        }

        access(all) fun getBuilders(): [Address] {
            return self.builders.keys
        }

        access(all) fun getSubmissions(): {Address: String} {
            return self.submissions
        }

        init(
            waveId: String,
            buildathonId: String,
            hostAddress: Address,
            name: String,
            maxBuilders: UInt64,
            prizeAmount: UFix64,
            deadline: UFix64?
        ) {
            self.waveId = waveId
            self.buildathonId = buildathonId
            self.hostAddress = hostAddress
            self.name = name
            self.maxBuilders = maxBuilders
            self.status = "open"
            self.prizeAmount = prizeAmount
            self.createdAt = getCurrentBlock().timestamp
            self.deadline = deadline
            self.builders = {}
            self.submissions = {}
            self.builderCount = 0
        }
    }

    // ─── WaveRegistry Resource ────────────────────────────────
    access(all) resource WaveRegistry {
        access(self) var waves: @{String: Wave}

        access(all) fun createWave(
            waveId: String,
            buildathonId: String,
            hostAddress: Address,
            name: String,
            maxBuilders: UInt64,
            prizeAmount: UFix64,
            deadline: UFix64?
        ): String {
            pre {
                self.waves[waveId] == nil: "Wave with this ID already exists"
                maxBuilders > 0: "maxBuilders must be greater than zero"
                name.length > 0: "Wave name cannot be empty"
            }
            let wave <- create Wave(
                waveId: waveId,
                buildathonId: buildathonId,
                hostAddress: hostAddress,
                name: name,
                maxBuilders: maxBuilders,
                prizeAmount: prizeAmount,
                deadline: deadline
            )
            self.waves[waveId] <-! wave
            emit WaveCreated(
                waveId: waveId,
                buildathonId: buildathonId,
                hostAddress: hostAddress,
                maxBuilders: maxBuilders
            )
            return waveId
        }

        access(all) fun joinWave(waveId: String, builderAddress: Address) {
            let wave = &self.waves[waveId] as &Wave?
                ?? panic("Wave not found: ".concat(waveId))
            wave.join(builderAddress: builderAddress)
        }

        access(all) fun checkCap(waveId: String): Bool {
            let wave = &self.waves[waveId] as &Wave?
                ?? panic("Wave not found: ".concat(waveId))
            return wave.isAtCapacity()
        }

        access(all) fun getWaveInfo(waveId: String): WaveInfo? {
            let wave = &self.waves[waveId] as &Wave?
            return wave?.getInfo()
        }

        access(all) fun getBuilders(waveId: String): [Address]? {
            let wave = &self.waves[waveId] as &Wave?
            return wave?.getBuilders()
        }

        access(all) fun updateWaveStatus(waveId: String, newStatus: String) {
            let wave = &self.waves[waveId] as &Wave?
                ?? panic("Wave not found: ".concat(waveId))
            wave.updateStatus(newStatus: newStatus)
        }

        access(all) fun addSubmission(waveId: String, builderAddress: Address, submissionId: String) {
            let wave = &self.waves[waveId] as &Wave?
                ?? panic("Wave not found: ".concat(waveId))
            wave.addSubmission(builderAddress: builderAddress, submissionId: submissionId)
        }

        init() {
            self.waves <- {}
        }
    }

    // ─── Storage paths ────────────────────────────────────────
    access(all) let WaveRegistryStoragePath: StoragePath
    access(all) let WaveRegistryPublicPath: PublicPath

    // ─── Contract init ────────────────────────────────────────
    init() {
        self.WaveRegistryStoragePath = /storage/CoordeWaveRegistry
        self.WaveRegistryPublicPath = /public/CoordeWaveRegistry

        let registry <- create WaveRegistry()
        self.account.storage.save(<- registry, to: self.WaveRegistryStoragePath)

        let cap = self.account.capabilities.storage.issue<&WaveRegistry>(self.WaveRegistryStoragePath)
        self.account.capabilities.publish(cap, at: self.WaveRegistryPublicPath)
    }
}
