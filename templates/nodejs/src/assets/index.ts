import { readFile } from 'node:fs/promises';


export enum Asset {
    HELLO = 'hello.txt'
}

export class AssetError extends Error {
    private constructor(name: string, message: string, cause: unknown) {
        super(`[AssetError::${name}] ${message}`, { cause });
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    static JsonParseError(cause: unknown) {
        return new AssetError('JsonParseError', 'JSON parse error', cause);
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    static JSONValidationError(cause: unknown) {
        return new AssetError('JSONValidationError', 'JSON validation error', cause);
    }
}

const getAssetURL = (asset: Asset) => new URL(asset, import.meta.url);

export async function getAssetText(asset: Asset) {
    return await readFile(getAssetURL(asset), 'utf8');
}

export async function getAssetBuffer(asset: Asset): Promise<Buffer> {
    return await readFile(getAssetURL(asset));
}

export async function getAssetJSON<T>(asset: Asset, validator: (arg: unknown) => arg is T): Promise<T>;
export async function getAssetJSON<T>(asset: Asset, assert: (arg: unknown) => asserts arg is T): Promise<T>;
export async function getAssetJSON(asset: Asset): Promise<unknown>;
export async function getAssetJSON<T>(asset: Asset, fn?: ((arg: unknown) => arg is T) | ((arg: unknown) => asserts arg is T)) {
    const raw = await getAssetText(asset);
    let json: unknown;
    try {
        json = JSON.parse(raw);
    } catch (error) {
        throw AssetError.JsonParseError(error);
    }

    if (!fn) {
        return json;
    }

    try {
        // this should only return boolean (if it's a type guard) or void/undefined (if it's type assertion that passed the check)
        const result = fn(json);
        switch (result) {
            case true:
            case undefined:
                return json;
            case false:
                throw AssetError.JSONValidationError(undefined);
            default:
                // this should never happen
                throw AssetError.JSONValidationError(result);
        }
    } catch (error) {
        throw AssetError.JSONValidationError(error);
    }
}
