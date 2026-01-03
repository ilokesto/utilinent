export interface UtilinentRegister {
}

export type RegisterProps<T extends string> = UtilinentRegister extends { [X in T]: infer Props } ? Props : never;
