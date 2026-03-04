// createWave.cdc
// Transaction: Create a new wave for a buildathon (Cadence 1.0)

import WaveManager from 0xf4112c315b4ed69b

transaction(
    waveId: String,
    buildathonId: String,
    name: String,
    maxBuilders: UInt64,
    prizeAmount: UFix64,
    deadline: UFix64?
) {

    let registryRef: &WaveManager.WaveRegistry
    let hostAddress: Address

    prepare(signer: auth(Storage, Capabilities) &Account) {
        self.hostAddress = signer.address

        self.registryRef = signer.capabilities
            .borrow<&WaveManager.WaveRegistry>(WaveManager.WaveRegistryPublicPath)
            ?? panic("Could not borrow WaveRegistry reference")
    }

    execute {
        self.registryRef.createWave(
            waveId: waveId,
            buildathonId: buildathonId,
            hostAddress: self.hostAddress,
            name: name,
            maxBuilders: maxBuilders,
            prizeAmount: prizeAmount,
            deadline: deadline
        )
    }
}
