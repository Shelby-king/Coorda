// joinWave.cdc
// Transaction: Builder joins a wave (Cadence 1.0)

import WaveManager from 0xf4112c315b4ed69b

transaction(waveId: String) {

    let registryRef: &WaveManager.WaveRegistry
    let builderAddress: Address

    prepare(signer: auth(Storage, Capabilities) &Account) {
        self.builderAddress = signer.address

        self.registryRef = signer.capabilities
            .borrow<&WaveManager.WaveRegistry>(WaveManager.WaveRegistryPublicPath)
            ?? panic("Could not borrow WaveRegistry reference")
    }

    execute {
        self.registryRef.joinWave(waveId: waveId, builderAddress: self.builderAddress)
    }
}
