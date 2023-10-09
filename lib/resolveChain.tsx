import { Chain, parseGwei } from "viem";
import { CryptoNetwork } from "../Models/CryptoNetwork";
import NetworkSettings from "./NetworkSettings";

export default function resolveChain(network: CryptoNetwork): Chain {

    const nativeCurrency = network.currencies.find(c => c.asset === network.native_currency);
    const blockExplorersBaseURL = new URL(network.transaction_explorer_template).origin;
    const metadata = network.metadata
    const { ensRegistry, ensUniversalResolver, multicall3 } = metadata || {}

    const res: Chain = {
        id: Number(network.chain_id),
        name: network.display_name,
        network: network.internal_name,
        nativeCurrency: {
            name: nativeCurrency?.name || "",
            symbol: nativeCurrency?.asset || "",
            decimals: nativeCurrency?.decimals || 0
        },
        rpcUrls: {
            default: {
                http: network.nodes.map(n => n?.url),
            },
            public: {
                http: network.nodes.map(n => n?.url),
            },
        },
        blockExplorers: {
            default: {
                name: 'name',
                url: blockExplorersBaseURL,
            },
        },
        contracts: {
            ...(multicall3 ? {
                multicall3:
                    multicall3
            } : {}),
            ...(ensRegistry ? {
                ensRegistry:
                    ensRegistry
            } : {}),
            ...(ensUniversalResolver ? {
                ensUniversalResolver:
                    ensUniversalResolver
            } : {}),
        },
    }

    const defaultPriorityFee = NetworkSettings.KnownSettings[network.internal_name]?.DefaultPriorityFee?.toString()
    const baseFeeMultiplier = NetworkSettings.KnownSettings[network.internal_name]?.BaseFeeMultiplier ?? 1.2

    if (defaultPriorityFee) {
        res.fees = {
            ...res.fees,
            defaultPriorityFee: () => parseGwei(defaultPriorityFee),
        }
    }
    if (baseFeeMultiplier) {
        res.fees = {
            ...res.fees,
            baseFeeMultiplier: () => baseFeeMultiplier
        }
    }
    return res
}