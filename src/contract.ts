import contractABI from "../contract_abi.json";

export const CONTRACT_ADDRESS = "0x2a0b1a2cd46ea76cb208fb42fc6d88518e5fcd6d" as const;
export const MOTIFY_ABI = contractABI;
export type MotifyABI = typeof contractABI;

/**
 * Challenge ID Offset Configuration
 * 
 * This offset is used to map frontend challenge IDs to blockchain challenge IDs.
 * Formula: blockchainChallengeId = frontendChallengeId + CHALLENGE_ID_OFFSET
 * 
 * HOW TO SET THE CORRECT OFFSET:
 * 1. Find a challenge that exists in both your frontend and blockchain
 * 2. Note the frontend ID (e.g., 5) and blockchain ID (e.g., 3)
 * 3. Calculate: CHALLENGE_ID_OFFSET = blockchainId - frontendId
 *    Example: 3 - 5 = -2, so set CHALLENGE_ID_OFFSET = -2
 * 
 * Common scenarios:
 * - Frontend starts at 1, blockchain starts at 0: set to -1
 * - Frontend starts at 1, blockchain starts at 5: set to 4
 * - Both start at same number: set to 0
 */
export const CHALLENGE_ID_OFFSET = 4;

/**
 * Helper function to convert frontend challenge ID to blockchain challenge ID
 */
export function toBlockchainChallengeId(frontendId: number): number {
    return frontendId + CHALLENGE_ID_OFFSET;
}

/**
 * Helper function to convert blockchain challenge ID to frontend challenge ID
 */
export function toFrontendChallengeId(blockchainId: number): number {
    return blockchainId - CHALLENGE_ID_OFFSET;
}
