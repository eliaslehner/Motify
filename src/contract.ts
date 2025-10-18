import contractABI from "../contract_abi.json";

export const CONTRACT_ADDRESS = "0xb2cbDDFa904A26ac51eC5fe8B3cE5004eA394Aae" as const;
export const MOTIFY_ABI = contractABI;
export type MotifyABI = typeof contractABI;