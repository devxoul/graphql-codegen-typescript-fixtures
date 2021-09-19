import yaml from 'js-yaml'

import { execAsync, getRandomString, writeFileAsync } from './utils'

type Options = {
  suffix?: string
  fixtureConfig?: FixtureConfig
  ignoreErrors?: boolean
}

type FixtureConfig = {
  typeDefinitionModule?: string
  scalarDefaults?: Record<string, string>
  immer?: boolean
}

type OptionsWithoutImmer = Options & (
  { fixtureConfig: undefined } | {
    fixtureConfig: {
      immer: false
    }
  }
)
type OptionsWithImmer = Options & {
  fixtureConfig: {
    immer: true
  }
}

export type Fixture = typeof import('./generated/graphql-fixtures-for-typing').default
export type FixtureWithImmer = typeof import('./generated/graphql-fixtures-for-typing-with-immer').default

async function setup(options?: OptionsWithoutImmer): Promise<Fixture>
async function setup(options?: OptionsWithImmer): Promise<FixtureWithImmer>
async function setup(options?: Options): Promise<Fixture>

async function setup(options?: Options): Promise<Fixture> {
  const suffix = options?.suffix || getRandomString()
  const configFilePath = `./tests/generated/codegen-${suffix}.yml`
  const fixtureModuleName = `graphql-fixtures-${suffix}`

  await writeConfig({
    configFilePath,
    fixtureModuleName,
    additionalFixtureConfig: options?.fixtureConfig
  })
  await runCodegen(configFilePath)

  const fixture = await safeImport({
    fixtureModuleName,
    ignoreErrors: options.ignoreErrors,
  })
  return fixture
}

export default setup


type WriteConfigOptions = {
  configFilePath: string
  fixtureModuleName: string
  additionalFixtureConfig?: FixtureConfig
}

const writeConfig = async (options: WriteConfigOptions) => {
  const jsonConfig = {
    overwrite: true,
    schema: './tests/schema/github.schema.graphql',
    documents: './tests/documents/*.graphql',
    generates: {
      './tests/generated/graphql.ts': {
        plugins: [
          'typescript',
        ],
      },
      [`./tests/generated/${options.fixtureModuleName}.ts`]: {
        plugins: [
          './build/index.js',
        ],
      }
    },
    config: {
      scalars: {
        Date: 'string',
        DateTime: 'string',
        URI: 'string',
      },
      fixtures: {
        typeDefinitionModule: './graphql',
        ...(options.additionalFixtureConfig || {}),
      }
    },
  }
  const yamlConfig = yaml.dump(jsonConfig, {
    quotingType: '"',
    forceQuotes: true,
  })
  await writeFileAsync(options.configFilePath, yamlConfig)
}


const runCodegen = async (configFilePath: string) => {
  await execAsync(`yarn graphql-codegen --config ${configFilePath}`)
}


type SafeImportOptions = {
  fixtureModuleName: string
  ignoreErrors?: boolean
}

const safeImport = async (options: SafeImportOptions) => {
  try {
    const { default: fixture } = await import(`./generated/${options.fixtureModuleName}`)
    return fixture
  } catch (error) {
    if (!options.ignoreErrors) {
      throw error
    }
  }
}
