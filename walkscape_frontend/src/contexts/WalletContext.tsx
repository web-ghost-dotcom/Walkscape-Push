'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BrowserProvider, JsonRpcProvider } from 'ethers';
import { usePushWalletContext, usePushChainClient, PushUI } from '@pushchain/ui-kit';
import { getContract, PlayerStats, provider as staticProvider } from '@/lib/web3';

interface WalletContextType {
    isLoading: boolean;
    provider: JsonRpcProvider | BrowserProvider | null;
    address: string | null;
    isConnected: boolean;
    isRegistered: boolean;
    registrationState: 'idle' | 'checking' | 'registered' | 'unregistered' | 'error';
    playerStats: PlayerStats | null;
    checkRegistration: () => Promise<void>;
    refreshPlayerStats: () => Promise<void>;
    retryRegistrationCheck: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
    const { connectionStatus } = usePushWalletContext();
    const { pushChainClient } = usePushChainClient();

    const [provider, setProvider] = useState<JsonRpcProvider | BrowserProvider | null>(null);
    const [isRegistered, setIsRegistered] = useState(false);
    const [registrationState, setRegistrationState] = useState<'idle' | 'checking' | 'registered' | 'unregistered' | 'error'>('idle');
    const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [registrationRetryCount, setRegistrationRetryCount] = useState(0);
    const checkLockRef = React.useRef(false);
    const lastCheckedAddressRef = React.useRef<string | null>(null);
    const previousConnectionStatusRef = React.useRef<string | null>(null);

    const maxRegistrationRetries = 3;
    const isConnected = connectionStatus === PushUI.CONSTANTS.CONNECTION.STATUS.CONNECTED;
    const address = isConnected && pushChainClient?.universal?.account ? pushChainClient.universal.account : null;

    // Track connection status changes for debugging
    useEffect(() => {
        if (previousConnectionStatusRef.current !== connectionStatus) {
            console.log('Connection status changed:', {
                from: previousConnectionStatusRef.current,
                to: connectionStatus,
                isConnected,
                address
            });
            previousConnectionStatusRef.current = connectionStatus;
        }
    }, [connectionStatus, isConnected, address]);

    useEffect(() => {
        const initializeProvider = async () => {
            if (isConnected && pushChainClient?.universal?.account) {
                try {
                    console.log('Initializing provider for Push Chain wallet');

                    // Try to use window.ethereum and ensure it's on Push Chain network
                    if (typeof window !== 'undefined' && (window as unknown as { ethereum?: unknown }).ethereum) {
                        const ethersProvider = new BrowserProvider((window as unknown as { ethereum: unknown }).ethereum as never);

                        // Check if we're on the correct network
                        try {
                            const network = await ethersProvider.getNetwork();
                            console.log('Current network chainId:', network.chainId.toString());

                            // If not on Push Chain, try to switch
                            if (network.chainId !== BigInt(42101)) {
                                console.log('Not on Push Chain, attempting to switch network...');
                                try {
                                    await ((window as unknown as { ethereum: { request: (args: { method: string; params: unknown[] }) => Promise<void> } }).ethereum.request({
                                        method: 'wallet_switchEthereumChain',
                                        params: [{ chainId: '0xa465' }], // 42101 in hex
                                    }));
                                    console.log('Successfully switched to Push Chain');
                                } catch (switchError: unknown) {
                                    // Chain not added yet, add it
                                    if ((switchError as { code?: number }).code === 4902) {
                                        await ((window as unknown as { ethereum: { request: (args: { method: string; params: unknown[] }) => Promise<void> } }).ethereum.request({
                                            method: 'wallet_addEthereumChain',
                                            params: [{
                                                chainId: '0xa465',
                                                chainName: 'Push Chain Testnet',
                                                nativeCurrency: {
                                                    name: 'PUSH',
                                                    symbol: 'PUSH',
                                                    decimals: 18
                                                },
                                                rpcUrls: ['https://evm.rpc-testnet-donut-node1.push.org/'],
                                                blockExplorerUrls: ['https://donut.push.network']
                                            }]
                                        }));
                                    }
                                }
                            }
                        } catch (networkError) {
                            console.error('Error checking/switching network:', networkError);
                        }

                        console.log('Created BrowserProvider from window.ethereum');
                        setProvider(ethersProvider);
                    } else {
                        console.log('No window.ethereum, using static JsonRpcProvider for Push Chain');
                        setProvider(staticProvider);
                    }
                } catch (error) {
                    console.error('Error initializing provider:', error);
                    // Fallback to static provider
                    console.log('Falling back to static JsonRpcProvider');
                    setProvider(staticProvider);
                }
            } else {
                console.log('Not connected, using static provider for read-only access');
                setProvider(staticProvider);
            }
        };
        initializeProvider();
    }, [isConnected, pushChainClient]);

    const fetchPlayerStats = useCallback(async (playerAddress: string) => {
        if (!provider) return;
        try {
            const contract = getContract(provider);
            const stats = await contract.getPlayerStats(playerAddress);
            const formatted: PlayerStats = {
                walksXp: stats.walksXp,
                healthScore: stats.healthScore,
                lastCheckin: Number(stats.lastCheckin),
                totalArtifacts: stats.totalArtifacts,
                currentColony: stats.currentColony,
                petsOwned: stats.petsOwned,
                grassTouchStreak: stats.grassTouchStreak
            };
            setPlayerStats(formatted);
        } catch (error) {
            console.error('Error fetching player stats:', error);
            setPlayerStats(null);
        }
    }, [provider]);

    const checkPlayerRegistration = useCallback(async (playerAddress: string) => {
        if (!provider || !playerAddress) {
            console.log('checkPlayerRegistration: missing provider or address');
            return;
        }
        // Prevent concurrent checks
        if (checkLockRef.current) {
            console.log('checkPlayerRegistration: check already in progress, skipping');
            return;
        }
        checkLockRef.current = true;
        lastCheckedAddressRef.current = playerAddress;

        try {
            setIsLoading(true);
            setRegistrationState('checking');
            console.log(`Checking registration for ${playerAddress}...`);
            const contract = getContract(provider);
            const isPlayerRegistered = await contract.registeredPlayers(playerAddress);

            // Ensure the result corresponds to the most recent address
            if (lastCheckedAddressRef.current !== playerAddress) {
                console.log('checkPlayerRegistration: address changed, ignoring result');
                // outdated response, ignore
                return;
            }

            console.log(`Registration check result: ${isPlayerRegistered}`);
            if (isPlayerRegistered) {
                setRegistrationState('registered');
                setIsRegistered(true);
                await fetchPlayerStats(playerAddress);
                setRegistrationRetryCount(0);
            } else {
                setRegistrationState('unregistered');
                setIsRegistered(false);
                setPlayerStats(null);
            }
        } catch (error: unknown) {
            console.error('Error checking player registration:', error);

            // Check for specific contract/RPC errors
            const errorMessage = (error as Error)?.message || '';
            const isContractError = errorMessage.includes('could not decode result data') ||
                errorMessage.includes('BAD_DATA') ||
                errorMessage.includes('call revert exception');

            if (isContractError) {
                console.error('Contract call failed - contract may not be deployed or RPC issue');
                setRegistrationState('error');
                setIsRegistered(false);
                setPlayerStats(null);
            } else if (registrationRetryCount < maxRegistrationRetries) {
                console.log(`Retrying registration check (${registrationRetryCount + 1}/${maxRegistrationRetries})...`);
                setRegistrationRetryCount(prev => prev + 1);
                // small delay before retrying
                setTimeout(async () => {
                    checkLockRef.current = false;
                    await checkPlayerRegistration(playerAddress);
                }, 2000);
            } else {
                console.error('Max retries reached, setting state to error');
                setRegistrationState('error');
                setIsRegistered(false);
                setPlayerStats(null);
            }
        } finally {
            setIsLoading(false);
            checkLockRef.current = false;
        }
    }, [provider, registrationRetryCount, maxRegistrationRetries, fetchPlayerStats]);

    // Debounced registration check when address/provider stabilizes
    useEffect(() => {
        let active = true;
        const debounceMs = 500;

        const runCheck = async () => {
            if (address && provider) {
                // wait briefly for potential rapid changes (e.g., wallet switching)
                await new Promise(r => setTimeout(r, debounceMs));
                if (!active) return;
                // only run if address still matches
                if (address === lastCheckedAddressRef.current && registrationState === 'registered') {
                    // already registered and checked for this address
                    console.log('Skipping check - already registered for this address');
                    return;
                }
                await checkPlayerRegistration(address as string);
            } else {
                // no address/provider: reset state to idle
                console.log('Wallet disconnected - resetting registration state');
                setRegistrationRetryCount(0);
                setRegistrationState('idle');
                setIsRegistered(false);
                setPlayerStats(null);
                lastCheckedAddressRef.current = null;
                checkLockRef.current = false; // Clear any locks
            }
        };

        runCheck();

        return () => {
            active = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [address, provider]);

    const checkRegistration = useCallback(async () => {
        if (address) {
            await checkPlayerRegistration(address as string);
        }
    }, [address, checkPlayerRegistration]);

    const refreshPlayerStats = useCallback(async () => {
        if (address && provider) {
            await fetchPlayerStats(address as string);
        }
    }, [address, provider, fetchPlayerStats]);

    const retryRegistrationCheck = useCallback(async () => {
        if (address) {
            setRegistrationRetryCount(0);
            await checkPlayerRegistration(address as string);
        }
    }, [address, checkPlayerRegistration]);

    useEffect(() => {
        if (!isConnected) {
            setIsLoading(false);
        }
    }, [isConnected]);

    const contextValue: WalletContextType = {
        isLoading,
        provider,
        address,
        isConnected,
        isRegistered,
        registrationState,
        playerStats,
        checkRegistration,
        refreshPlayerStats,
        retryRegistrationCheck,
    };

    return (
        <WalletContext.Provider value={contextValue}>
            {children}
        </WalletContext.Provider>
    );
}

export function useWallet() {
    const context = useContext(WalletContext);
    if (!context) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
}
