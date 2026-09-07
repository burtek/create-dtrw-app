/* eslint-disable @stylistic/object-curly-newline */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-object-type */
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';
import '@testing-library/jest-dom';


// import '@testing-library/jest-dom/vitest';


// Remove this and restore the import above once https://github.com/testing-library/jest-dom/issues/738 is resolved
declare module 'vitest' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface Assertion<R extends void | Promise<void> = void, T = unknown> extends TestingLibraryMatchers<any, R> {}
    interface AsymmetricMatchersContaining extends TestingLibraryMatchers<any, any> {}
}
