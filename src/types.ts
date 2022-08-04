

export interface Dictionary<T> {
    [Key: string]: T;
}

export interface IQuerystring {
    rpcUrl?: string;
    blockUnverifiedContracts?: boolean;
    enableScanners?: string;
}

export interface IRouteParams {
    network: string;
}
