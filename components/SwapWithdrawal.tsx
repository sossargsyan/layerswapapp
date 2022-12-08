import { useRouter } from "next/router";
import { FC, useEffect } from "react";
import { FormWizardProvider } from "../context/formWizardProvider";
import { useQueryState } from "../context/query";
import { useSettingsState } from "../context/settings";
import { useSwapDataState, useSwapDataUpdate } from "../context/swap";
import { SwapType } from "../lib/layerSwapApiClient";
import { DepositFlow } from "../Models/Exchange";
import { SwapStatus } from "../Models/SwapStatus";
import { SwapWithdrawalStep } from "../Models/Wizard";
import { GetSwapStatusStep } from "./utils/SwapStatus";
import SwapWithdrawalWizard from "./Wizard/SwapWithdrawalWizard";

const SwapWithdrawal: FC = () => {
    const settings = useSettingsState()
    const { exchanges, networks } = settings
    const { swap } = useSwapDataState()
    const { mutateSwap } = useSwapDataUpdate()
    const query = useQueryState()
    const router = useRouter()
    useEffect(() => {
        mutateSwap()
    }, [])

    if (!swap)
        return <div className={`pb-6 bg-darkblue shadow-card rounded-lg w-full overflow-hidden relative animate-pulse h-[548px]`}>

        </div>

    const exchange = exchanges.find(e => e.currencies.some(ec => ec.id === swap?.exchange_currency_id))
    const network = networks.find(n => n.currencies.some(ec => ec.id === swap?.network_currency_id))
    let initialStep: SwapWithdrawalStep = GetSwapStatusStep(swap);

    if (!initialStep) {
        if (swap?.type === SwapType.OffRamp) {
            if (network.deposit_method === "address")
                initialStep = (query.signature && query.addressSource === "imxMarketplace") ? SwapWithdrawalStep.ProcessingWalletTransaction : SwapWithdrawalStep.WalletConnect
            else {
                initialStep = SwapWithdrawalStep.OffRampWithdrawal
            }
        }
        else if (exchange?.deposit_flow === DepositFlow.Manual)
            initialStep = SwapWithdrawalStep.Withdrawal
        else if (exchange?.deposit_flow === DepositFlow.External)
            initialStep = SwapWithdrawalStep.ExternalPayment
        else
            initialStep = SwapWithdrawalStep.Processing
    }
    const key = Object.keys(query).join("")

    return (
        <FormWizardProvider initialStep={initialStep} initialLoading={true} key={key}>
            <SwapWithdrawalWizard />
        </FormWizardProvider>
    )
};

export default SwapWithdrawal;