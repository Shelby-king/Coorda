// getWaveBuilders.cdc
// Script: Get all builder addresses for a wave (read-only, Cadence 1.0)

import WaveManager from 0xf4112c315b4ed69b

access(all) fun main(contractAddress: Address, waveId: String): [Address]? {
    let registry = getAccount(contractAddress)
        .capabilities
        .borrow<&WaveManager.WaveRegistry>(WaveManager.WaveRegistryPublicPath)
        ?? panic("Could not borrow WaveRegistry from address: ".concat(contractAddress.toString()))

    return registry.getBuilders(waveId: waveId)
}
