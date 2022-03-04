import dedent from 'dedent'
import { GraphQLSchema, parse, printSchema, visit } from 'graphql'

import { PluginFunction, Types } from '@graphql-codegen/plugin-helpers'

import { FixturesVisitor } from './visitor'

export const plugin: PluginFunction<any, Types.ComplexPluginOutput> = (
  schema,
  documents,
  config,
) => {
  const visitor = new FixturesVisitor(schema, config)
  return {
    prepend: getPrepend(visitor),
    content: getContent(schema, visitor),
    append: getAppend(visitor)
  }
}

const getPrepend = (visitor: FixturesVisitor) => {
  const prepend: string[] = []

  if (visitor.config.immer) {
    prepend.push(`import produce from 'immer'`)
    prepend.push(`import { Produced } from 'immer/dist/internal'\n`)
  }

  if (visitor.config.typeDefinitionModule) {
    prepend.push(`import * as types from '${visitor.config.typeDefinitionModule}'\n`)
  }

  prepend.push('const fixtureMap = {')
  return prepend
}

const getContent = (schema: GraphQLSchema, visitor: FixturesVisitor) => {
  const printedSchema = printSchema(schema)
  const astNode = parse(printedSchema)

  const content = visit(astNode, visitor)
    .definitions.filter(Boolean)
    .join('\n')
  return '  ' + content.split('\n').join('\n  ')
}

const getAppend = (visitor: FixturesVisitor) => {
  const closingBracket = '}'
  const fixtureFunctionDefinition = getFixtureFunctionDefinition(visitor.config.immer)
  const exportDefaultStatement = 'export default fixture'

  const append = filterTruthy([
    closingBracket,
    fixtureFunctionDefinition,
    exportDefaultStatement,
  ])
  return append.map(line => line + '\n')
}

const getFixtureFunctionDefinition = (immer: boolean) => {
  const generics = filterTruthy([
    'Name extends keyof typeof fixtureMap',
    'Fixture extends ReturnType<typeof fixtureMap[Name]>',
    immer && 'ProduceReturn = void',
  ])
  const parameters = filterTruthy([
    'name: Name',
    immer && 'recipe?: (draft: Fixture) => ProduceReturn',
  ])
  const returnType = immer
    ? 'Fixture | Produced<Fixture, ProduceReturn>'
    : 'Fixture'
  const returnStatement = immer
    ? 'return recipe ? produce(fixture, recipe) : fixture'
    : 'return fixture'

  return dedent`
    const fixture = <
      ${generics.join(',\n      ')}
    >(
      ${parameters.join(',\n      ')}
    ): ${returnType} => {
      const fixture = fixtureMap[name]() as Fixture
      ${returnStatement}
    }
  `
}

const filterTruthy = (array: (string | false | undefined | null)[]): string[] => {
  return array.filter((item): item is string => !!item)
}
