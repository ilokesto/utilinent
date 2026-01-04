import { TagProxyCategory } from "./tagProxyTypes";

export interface UtilinentRegister {
}

export type RegisterProps<T extends TagProxyCategory> = UtilinentRegister extends { [X in T]: infer Props } ? Props : never;
