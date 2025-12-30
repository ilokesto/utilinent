export interface UtilinentRegister {
}
export type UtilinentRegisterShow = UtilinentRegister extends { show: infer Show } ? Show : never;
export type UtilinentRegisterBase = UtilinentRegister extends { base: infer Base } ? Base : never;
export type UtilinentRegisterFor = UtilinentRegister extends { for: infer For } ? For : never;
export type UtilinentRegisterRepeat = UtilinentRegister extends { repeat: infer Repeat } ? Repeat : never;
export type UtilinentRegisterMount = UtilinentRegister extends { mount: infer Mount } ? Mount : never;
export type UtilinentRegisterSwitch = UtilinentRegister extends { switch: infer Switch } ? Switch : never;
