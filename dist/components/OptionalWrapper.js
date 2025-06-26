export function OptionalWrapper({ when, children, wrapper, }) {
    return when ? wrapper(children) : children;
}
