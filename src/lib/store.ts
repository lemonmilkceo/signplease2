import { create } from 'zustand';
import { ContractData, User, MOCK_CONTRACTS } from './contract-types';

interface AppState {
  // User
  user: User | null;
  isDemo: boolean;
  setUser: (user: User | null) => void;
  setIsDemo: (isDemo: boolean) => void;

  // Contract Form
  contractForm: Partial<ContractData>;
  setContractForm: (data: Partial<ContractData>) => void;
  resetContractForm: () => void;

  // Contracts List
  contracts: ContractData[];
  addContract: (contract: ContractData) => void;
  updateContract: (id: string, data: Partial<ContractData>) => void;

  // Current viewing contract (for worker)
  currentContract: ContractData | null;
  setCurrentContract: (contract: ContractData | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // User
  user: null,
  isDemo: false,
  setUser: (user) => set({ user }),
  setIsDemo: (isDemo) => set({ isDemo }),

  // Contract Form
  contractForm: {},
  setContractForm: (data) => set((state) => ({
    contractForm: { ...state.contractForm, ...data }
  })),
  resetContractForm: () => set({ contractForm: {} }),

  // Contracts List
  contracts: MOCK_CONTRACTS,
  addContract: (contract) => set((state) => ({
    contracts: [contract, ...state.contracts]
  })),
  updateContract: (id, data) => set((state) => ({
    contracts: state.contracts.map((c) =>
      c.id === id ? { ...c, ...data } : c
    )
  })),

  // Current viewing contract
  currentContract: null,
  setCurrentContract: (contract) => set({ currentContract: contract }),
}));
