import { useFormikContext } from "formik";
import { FC, useCallback, useEffect } from "react";
import { useSettingsState } from "../../context/settings";
import { SwapFormValues } from "../DTOs/SwapFormValues";
import { SelectMenuItem } from "../Select/Shared/Props/selectMenuItem";
import PopoverSelectWrapper from "../Select/Popover/PopoverSelectWrapper";
import CurrencySettings from "../../lib/CurrencySettings";
import { SortingByAvailability } from "../../lib/sorting";
import { useQueryState } from "../../context/query";
import { ApiResponse } from "../../Models/ApiResponse";
import useSWR from "swr";
import LayerSwapApiClient from "../../lib/layerSwapApiClient";

const CurrencyGroupFormField: FC<{ direction: string }> = ({ direction }) => {
    const {
        values,
        setFieldValue,
    } = useFormikContext<SwapFormValues>();
    const { to, fromCurrency, toCurrency, from, currencyGroup, toExchange, fromExchange } = values

    const { sourceRoutes: settingsSourceRoutes, destinationRoutes: settingsDestinationRoutes, assetGroups } = useSettingsState();
    const name = 'currencyGroup'

    const query = useQueryState()

    const routes = direction === 'from' ? settingsSourceRoutes : settingsDestinationRoutes

    const availableAssetGroups = assetGroups.filter(g => g.values.some(v => routes.some(r => !!r.tokens.find(t => t.symbol === v.asset) && r.name === v.network)))

    const lockAsset = direction === 'from' ? query?.lockFromAsset : query?.lockToAsset
    const asset = direction === 'from' ? query?.fromAsset : query?.toAsset
    const lockedCurrency = lockAsset
        ? availableAssetGroups?.find(a => a.name.toUpperCase() === (asset)?.toUpperCase())
        : undefined

    const apiClient = new LayerSwapApiClient()
    const include_unmatched = 'true'

    const sourceRouteParams = new URLSearchParams({
        include_unmatched,
        ...(toExchange && currencyGroup && currencyGroup?.groupedInBackend ?
            {
                destination_asset_group: currencyGroup?.name
            }
            : {
                ...(to && toCurrency &&
                {
                    destination_network: to.name,
                    destination_asset: toCurrency?.symbol
                })
            })
    });

    const destinationRouteParams = new URLSearchParams({
        include_unmatched,
        ...(fromExchange && currencyGroup && currencyGroup?.groupedInBackend ?
            {
                source_asset_group: currencyGroup?.name
            }
            : {
                ...(from && fromCurrency &&
                {
                    source_network: from.name,
                    source_asset: fromCurrency?.symbol
                })
            })
    });

    const sourceRoutesURL = `/sources?${sourceRouteParams}`
    const destinationRoutesURL = `/destinations?${destinationRouteParams}`

    const {
        data: sourceRoutes,
        isLoading: sourceRoutesLoading,
    } = useSWR<ApiResponse<{ network: string; asset: string }[]>>(`${sourceRoutesURL}`, apiClient.fetcher)

    const {
        data: destinationRoutes,
        isLoading: destRoutesLoading,
    } = useSWR<ApiResponse<{ network: string; asset: string }[]>>(`${destinationRoutesURL}`, apiClient.fetcher)

    const filteredCurrencies = lockedCurrency ? [lockedCurrency] : availableAssetGroups

    const currencyMenuItems = GenerateCurrencyMenuItems(
        filteredCurrencies!,
        values,
        direction === "from" ? sourceRoutes?.data : destinationRoutes?.data,
        lockedCurrency,
    )

    const value = currencyMenuItems?.find(x => x.id == currencyGroup?.name);

    useEffect(() => {
        if (value) return
        setFieldValue(name, currencyMenuItems?.[0]?.baseObject)
    }, [])

    const handleSelect = useCallback((item: SelectMenuItem<AssetGroup>) => {
        setFieldValue(name, item.baseObject, true)
    }, [name, direction, toCurrency, fromCurrency, from, to])

    return <PopoverSelectWrapper
        placeholder="Asset"
        values={currencyMenuItems}
        value={value}
        setValue={handleSelect}
        disabled={!value?.isAvailable?.value}
    />;
}

export function GenerateCurrencyMenuItems(
    currencies: AssetGroup[],
    values: SwapFormValues,
    routes?: { network: string, asset: string }[],
    lockedCurrency?: AssetGroup | undefined
): SelectMenuItem<AssetGroup>[] {
    const { fromExchange, toExchange } = values
    let currencyIsAvailable = (currency: AssetGroup) => {
        if (lockedCurrency) {
            return { value: false, disabledReason: CurrencyDisabledReason.LockAssetIsTrue }
        }
        else if ((fromExchange || toExchange) && !routes?.some(r => r.asset === currency.name)) {
            return { value: true, disabledReason: CurrencyDisabledReason.InvalidRoute }
        }
        else {
            return { value: true, disabledReason: null }
        }
    }

    const storageUrl = process.env.NEXT_PUBLIC_RESOURCE_STORAGE_URL

    return currencies?.map(c => {
        const currency = c
        const displayName = lockedCurrency?.name ?? currency.name;

        const res: SelectMenuItem<AssetGroup> = {
            baseObject: c,
            id: c.name,
            name: displayName || "-",
            order: CurrencySettings.KnownSettings[c.name]?.Order ?? 5,
            imgSrc: `${storageUrl}layerswap/currencies/${c.name.toLowerCase()}.png`,
            isAvailable: currencyIsAvailable(c),
        };
        return res
    }).sort(SortingByAvailability);
}

export enum CurrencyDisabledReason {
    LockAssetIsTrue = '',
    InsufficientLiquidity = 'Temporarily disabled. Please check later.',
    InvalidRoute = 'InvalidRoute'
}

export type AssetGroup = {
    name: string;
    values: {
        network: string;
        asset: string;
    }[];
    groupedInBackend: boolean
}

export default CurrencyGroupFormField