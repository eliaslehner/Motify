// Contract ABIs
import motifyArtifact from "../contract_abi/Motify.json";
import mockUSDCArtifact from "../contract_abi/MockUSDC.json";
import motifyTokenArtifact from "../contract_abi/MotifyToken.json";

// Contract Addresses
export const CONTRACTS = {
    MOTIFY: "0x64F154cb8F7a0BF91B8e922406Be27a45671C09A" as const,
    MOCK_USDC: "0x83d37b00C8cEe7EfD6DE86817D317b82617Faad6" as const,
    MOTIFY_TOKEN: "0x7dc145CA6533bB5d170F4894a8c05F907AC6160c" as const,
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