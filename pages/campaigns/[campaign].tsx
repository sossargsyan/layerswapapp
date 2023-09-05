import Layout from '../../components/layout'
import LayerSwapApiClient from '../../lib/layerSwapApiClient'
import { InferGetServerSidePropsType } from 'next'
import { SettingsProvider } from '../../context/settings'
import { MenuProvider } from '../../context/menu'
import LayerSwapAuthApiClient from '../../lib/userAuthApiClient'
import { LayerSwapAppSettings } from '../../Models/LayerSwapAppSettings'
import RewardComponent from '../../components/Rewards/RewardComponent'
import { getServerSideSettings } from '../../helpers/getSettings'

export default function RewardsPage({ settings }: InferGetServerSidePropsType<typeof getServerSideSettings>) {
    LayerSwapAuthApiClient.identityBaseEndpoint = settings.discovery.identity_url
    let appSettings = new LayerSwapAppSettings(settings)

    appSettings.networks = appSettings.networks.filter((element) =>
        element.status !== "inactive")

    appSettings.exchanges = appSettings.exchanges.filter(e => e.status === 'active')

    return (
        <Layout>
            <SettingsProvider data={appSettings}>
                <MenuProvider>
                    <RewardComponent />
                </MenuProvider>
            </SettingsProvider>
        </Layout>
    )
}