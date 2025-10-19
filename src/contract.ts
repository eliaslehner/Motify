// Contract ABIs
import motifyABI from "../contract_abi/motify.json";
import mockUSDCABI from "../contract_abi/mockUSDC.json";
import motifyTokenABI from "../contract_abi/motifyToken.json";

// Contract Addresses
export const CONTRACTS = {
    MOTIFY: "0xF46073A8FF2f1F03ecf9234a07599f74d797D8E2" as const,
    MOCK_USDC: "0xb608011bCea21a4F40f7CB4Ffc666711AA65d8BF" as const,
    MOTIFY_TOKEN: "0x50f8eFD44e2d473521074bc37C0B6732f105716A" as const,
} as const;

// ABIs
export const ABIS = {
    MOTIFY: motifyABI,
    MOCK_USDC: mockUSDCABI,
    MOTIFY_TOKEN: motifyTokenABI,
} as const;

// Legacy exports for backward compatibility
export const CONTRACT_ADDRESS = CONTRACTS.MOTIFY;
export const MOTIFY_ABI = ABIS.MOTIFY;

// Types
export type MotifyABI = typeof motifyABI;
export type MockUSDCABI = typeof mockUSDCABI;
export type MotifyTokenABI = typeof motifyTokenABI;