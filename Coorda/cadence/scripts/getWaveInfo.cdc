// getWaveInfo.cdc
// Script: Query wave info (read-only, Cadence 1.0)

import WaveManager from 0xf4112c315b4ed69b

access(all) fun main(contractAddress: Address, waveId: String): WaveManager.WaveInfo? {
    let registry = getAccount(contractAddress)
        .capabilities
        .borrow<&WaveManager.WaveRegistry>(WaveManager.WaveRegistryPublicPath)
        ?? panic("Could not borrow WaveRegistry from address: ".concat(contractAddress.toString()))

    return registry.getWaveInfo(waveId: waveId)
}
