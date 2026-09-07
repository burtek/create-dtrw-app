import { readFileSync } from 'node:fs'
import { extname } from 'node:path'
import { expect } from 'vitest'
import type { Matcher, MatcherResult, MatcherState } from 'vitest'
import YAML from 'yaml'


type FileObject = Record<string, unknown>

const toMatchFileObject: Matcher<
  MatcherState,
  [expected: FileObject]
> = function (
  received,
  expected,
): MatcherResult {
  if (typeof received !== 'string') {
    throw new TypeError('toMatchFileObject expects a file path')
  }

  const extension = extname(received).toLowerCase()

  let actual: unknown

  switch (extension) {
    case '.json':
      actual = JSON.parse(readFileSync(received, 'utf8'))
      break

    case '.yaml':
    case '.yml':
      actual = YAML.parse(readFileSync(received, 'utf8'))
      break

    default:
      throw new TypeError(
        `toMatchFileObject does not support "${extension}" files`,
      )
  }

  const expectedMatcher = expect.objectContaining(expected)
  const pass = this.equals(actual, expectedMatcher)

  return {
    pass,
    actual,
    expected,
    message: () =>
      `expected file "${received}" ${this.isNot ? 'not ' : ''}to match object`,
  }
}

expect.extend({
  toMatchFileObject,
});

declare module 'vitest' {
  interface Matchers<R, T> {
    toMatchFileObject(expected: Record<string, unknown>): R
  }
}
