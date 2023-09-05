import Layout from '../components/layout'
import { MenuProvider } from '../context/menu'
import { SettingsProvider } from '../context/settings'
import { InferGetServerSidePropsType } from 'next'
import LayerSwapAuthApiClient from '../lib/userAuthApiClient'
import { SwapDataProvider } from '../context/swap'
import TransfersWrapper from '../components/SwapHistory/TransfersWrapper'
import { LayerSwapAppSettings } from '../Models/LayerSwapAppSettings'
import LayerSwapApiClient from '../lib/layerSwapApiClient'

export default function Transactions({ settings }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  LayerSwapAuthApiClient.identityBaseEndpoint = settings.discovery.identity_url
  let appSettings = new LayerSwapAppSettings(settings)

  return (
      <Layout>
        <SettingsProvider data={appSettings}>
          <MenuProvider>
            <SwapDataProvider >
              <TransfersWrapper />
            </SwapDataProvider >
          </MenuProvider>
        </SettingsProvider>
      </Layout>
  )
}

export async function getServerSideProps(context) {
  context.res.setHeader(
    'Cache-Control',
    's-maxage=60, stale-while-revalidate'
  );

  var apiClient = new LayerSwapApiClient();
  const { data: settings } = await apiClient.GetSettingsAsync()

  return {
    props: { settings },
  }
}