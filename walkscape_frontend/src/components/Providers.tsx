'use client';

import { WalletProvider } from '@/contexts/WalletContext';
import AppLayout from '@/components/AppLayout';
import { PushUniversalWalletProvider, PushUI } from '@pushchain/ui-kit';

export default function Providers({ children }: { children: React.ReactNode }) {
    // Push Chain Wallet Configuration
    const walletConfig = {
        network: PushUI.CONSTANTS.PUSH_NETWORK.TESTNET,
        login: {
            email: true,
            google: true,
            wallet: {
                enabled: true,
            },
            appPreview: true,
        },
        modal: {
            loginLayout: PushUI.CONSTANTS.LOGIN.LAYOUT.SPLIT,
            connectedLayout: PushUI.CONSTANTS.CONNECTED.LAYOUT.HOVER,
            appPreview: true,
        },
    };

    // App metadata for wallet modal
    const appMetadata = {
        logoUrl: '/icon.png',
        title: 'WalkScape',
        description: 'Explore, Collect, Grow - A mobile-first social exploration game on Push Chain',
    };

    return (
        <PushUniversalWalletProvider config={walletConfig} app={appMetadata}>
            <WalletProvider>
                <AppLayout>
                    {children}
                </AppLayout>
            </WalletProvider>
        </PushUniversalWalletProvider>
    );
}
