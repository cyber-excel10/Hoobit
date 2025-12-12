import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

// Flow EVM Testnet Configuration
const FLOW_EVM_TESTNET = {
  chainId: 545, // Flow EVM Testnet chain ID
  chainIdHex: '0x221',
  name: 'Flow EVM Testnet',
  rpcUrl: 'https://testnet.evm.nodes.onflow.org',
  blockExplorer: 'https://evm-testnet.flowscan.io',
  currency: {
    name: 'Flow',
    symbol: 'FLOW',
    decimals: 18,
  },
};

interface WalletState {
  address: string | null;
  balance: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  isWrongNetwork: boolean;
  chainId: number | null;
  error: string | null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    balance: null,
    isConnected: false,
    isConnecting: false,
    isWrongNetwork: false,
    chainId: null,
    error: null,
  });

  const getProvider = useCallback(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      return new ethers.BrowserProvider((window as any).ethereum);
    }
    return null;
  }, []);

  const checkNetwork = useCallback(async () => {
    const provider = getProvider();
    if (!provider) return false;

    try {
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      const isCorrectNetwork = chainId === FLOW_EVM_TESTNET.chainId;
      
      setState(prev => ({
        ...prev,
        chainId,
        isWrongNetwork: !isCorrectNetwork,
      }));
      
      return isCorrectNetwork;
    } catch (error) {
      console.error('Error checking network:', error);
      return false;
    }
  }, [getProvider]);

  const switchNetwork = useCallback(async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) return false;

    try {
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: FLOW_EVM_TESTNET.chainIdHex }],
      });
      return true;
    } catch (switchError: any) {
      // Chain not added, try to add it
      if (switchError.code === 4902) {
        try {
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: FLOW_EVM_TESTNET.chainIdHex,
              chainName: FLOW_EVM_TESTNET.name,
              rpcUrls: [FLOW_EVM_TESTNET.rpcUrl],
              blockExplorerUrls: [FLOW_EVM_TESTNET.blockExplorer],
              nativeCurrency: FLOW_EVM_TESTNET.currency,
            }],
          });
          return true;
        } catch (addError) {
          console.error('Error adding network:', addError);
          return false;
        }
      }
      console.error('Error switching network:', switchError);
      return false;
    }
  }, []);

  const fetchBalance = useCallback(async (address: string) => {
    const provider = getProvider();
    if (!provider) return null;

    try {
      const balance = await provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error fetching balance:', error);
      return null;
    }
  }, [getProvider]);

  const connect = useCallback(async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      setState(prev => ({ ...prev, error: 'Please install MetaMask or a compatible wallet' }));
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const provider = getProvider();
      if (!provider) throw new Error('Provider not available');

      // Request account access
      const accounts = await (window as any).ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const address = accounts[0];
      
      // Check and switch network
      const isCorrectNetwork = await checkNetwork();
      if (!isCorrectNetwork) {
        await switchNetwork();
        await checkNetwork();
      }

      const balance = await fetchBalance(address);

      setState({
        address,
        balance,
        isConnected: true,
        isConnecting: false,
        isWrongNetwork: false,
        chainId: FLOW_EVM_TESTNET.chainId,
        error: null,
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error.message || 'Failed to connect wallet',
      }));
    }
  }, [getProvider, checkNetwork, switchNetwork, fetchBalance]);

  const disconnect = useCallback(() => {
    setState({
      address: null,
      balance: null,
      isConnected: false,
      isConnecting: false,
      isWrongNetwork: false,
      chainId: null,
      error: null,
    });
  }, []);

  const shortenAddress = useCallback((address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  // Listen for account and network changes
  useEffect(() => {
    if (typeof window === 'undefined' || !(window as any).ethereum) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        const balance = await fetchBalance(accounts[0]);
        setState(prev => ({
          ...prev,
          address: accounts[0],
          balance,
        }));
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    (window as any).ethereum.on('accountsChanged', handleAccountsChanged);
    (window as any).ethereum.on('chainChanged', handleChainChanged);

    return () => {
      (window as any).ethereum.removeListener('accountsChanged', handleAccountsChanged);
      (window as any).ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [disconnect, fetchBalance]);

  // Check if already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window === 'undefined' || !(window as any).ethereum) return;

      try {
        const accounts = await (window as any).ethereum.request({
          method: 'eth_accounts',
        });

        if (accounts.length > 0) {
          const balance = await fetchBalance(accounts[0]);
          await checkNetwork();
          
          setState(prev => ({
            ...prev,
            address: accounts[0],
            balance,
            isConnected: true,
          }));
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    };

    checkConnection();
  }, [fetchBalance, checkNetwork]);

  return {
    ...state,
    connect,
    disconnect,
    switchNetwork,
    shortenAddress,
    getProvider,
    networkConfig: FLOW_EVM_TESTNET,
  };
}
