// Contract ABIs
import motifyArtifact from "../contract_abi/Motify.json";
import mockUSDCArtifact from "../contract_abi/MockUSDC.json";
import motifyTokenArtifact from "../contract_abi/MotifyToken.json";

// Contract Addresses
export const CONTRACTS = {
    MOTIFY: "0x53Da03A36Aa9333C41C5521A113d0f8BA028bC43" as const,
    MOCK_USDC: "0x83d37b00C8cEe7EfD6DE86817D317b82617Faad6" as const,
    MOTIFY_TOKEN: "0xc19112393585Af1250352AF7B4EDdc23d8a55c3a" as const,
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