import setup, { Fixture } from './setup'
import { execAsync } from './utils'

jest.setTimeout(10000)

let fixture: Fixture

beforeAll(async () => {
  fixture = await setup({
    fixtureConfig: {
      scalarDefaults: {
        URI: `'https://example.com'`,
      },
    }
  })
})

describe('Scalar', () => {
  describe('when the default value is not configured', () => {
    it('defaults to the empty object', async () => {
      expect(fixture('Base64String')).toEqual({})
      expect(fixture('FileAddition').contents).toEqual({})
    })
  })

  describe('when the default value is configured', () => {
    it('defaults to the pre-configured value', () => {
      expect(fixture('URI')).toEqual('https://example.com')
      expect(fixture('Issue').url).toEqual('https://example.com')
    })
  })
})

describe('Object', () => {
  it('properties are empty by default', () => {
    const repository = fixture('Repository')
    expect(repository.name).toEqual('')
    expect(repository.owner.login).toEqual('')
    expect(repository.stargazerCount).toEqual(0)
    expect(repository.isEmpty).toEqual(false)
    expect(repository.homepageUrl).toBeUndefined()
    expect(repository.createdAt).toEqual('')
    expect(repository.url).toEqual('https://example.com')
  })
})

describe('Interface', () => {
  it('properties are empty by default', () => {
    const repositoryOwner = fixture('RepositoryOwner')
    expect(repositoryOwner.login).toEqual('')
    expect(repositoryOwner.avatarUrl).toEqual('https://example.com')
  })
})

describe('Union', () => {
  it('defaults to the first type', () => {
    const issueOrPullRequest = fixture('IssueOrPullRequest')
    expect(issueOrPullRequest.__typename).toEqual('Issue')
  })
})

describe('Enum', () => {
  it('defaults to the first value', () => {
    const issueState = fixture('IssueState')
    expect(issueState).toEqual('CLOSED')
  })
})

describe('InputObject', () => {
  it('properties are empty by default', () => {
    const createIssueInput = fixture('CreateIssueInput')
    expect(createIssueInput.title).toEqual('')
    expect(createIssueInput.body).toBeUndefined()
  })
})

describe('a fixture with immer', () => {
  it('properties can be configured', async () => {
    const fixture = await setup({
      fixtureConfig: {
        immer: true,
      },
    })
    const repository = fixture('Repository', repo => {
      repo.name = 'graphql-codegen-typescript-fixtures'
      repo.owner.login = 'pocketlesson'
      repo.stargazerCount = 1234
      repo.homepageUrl = 'https://pocketlesson.com'
    })
    expect(repository.name).toEqual('graphql-codegen-typescript-fixtures')
    expect(repository.owner.login).toEqual('pocketlesson')
    expect(repository.stargazerCount).toEqual(1234)
    expect(repository.isEmpty).toEqual(false)
    expect(repository.homepageUrl).toEqual('https://pocketlesson.com')
  })
})

it('typecheck', async () => {
  let error: Error | undefined
  try {
    await execAsync('yarn tsc tests/generated/graphql-fixtures-for-typing.ts --noemit --skipLibCheck')
    error = undefined
  } catch (err) {
    error = err
  }
  expect(error).toBeUndefined()
})
