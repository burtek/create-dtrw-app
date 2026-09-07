// type Predicate<T, S extends T> = Function & {
//     (arg: T): asserts arg is S;
// };

declare global {
    interface Array<T> {
        includes<S>(arg: T extends S ? S : T): boolean;
        
        // forEach<S extends T>(predicate: Predicate<T, S>): asserts this is S[];
    }
}

export {};
