// Contract ABIs
import motifyArtifact from "../contract_abi/Motify.json";
import mockUSDCArtifact from "../contract_abi/MockUSDC.json";
import motifyTokenArtifact from "../contract_abi/MotifyToken.json";

// Contract Addresses
export const CONTRACTS = {
    MOTIFY: "0xA9849D7627ad1156b97cdF84AccD67b86611C200" as const,
    MOCK_USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const,
    MOTIFY_TOKEN: "0x790013Ff3634440eAF28FFde1c8A14aF41CB1fBF" as const,
} as const;

// ABIs - Extract the ABI array from the Hardhat artifact format
export const ABIS = {
    MOTIFY: motifyArtifact.abi,
    MOCK_USDC: mockUSDCArtifact.abi,
    MOTIFY_TOKEN: motifyTokenArtifact.abi,
} as const;

// Legacy exports for backward compatibility
export const CONTRACT_ADDRESS = CONTRACTS.MOTIFY;
export const MOTIFY_ABI = ABIS.MOTIFY;

// Types
export type MotifyABI = typeof motifyArtifact.abi;
export type MockUSDCABI = typeof mockUSDCArtifact.abi;
export type MotifyTokenABI = typeof motifyTokenArtifact.abi;