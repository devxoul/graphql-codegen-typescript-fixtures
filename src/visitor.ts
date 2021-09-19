import dedent from 'dedent'
import {
  EnumTypeDefinitionNode, GraphQLSchema, InputObjectTypeDefinitionNode, InterfaceTypeDefinitionNode,
  NamedTypeNode, NameNode, ObjectTypeDefinitionNode, ScalarTypeDefinitionNode, TypeNode,
  UnionTypeDefinitionNode
} from 'graphql'

import {
  BaseVisitor, ParsedTypesConfig, RawTypesConfig
} from '@graphql-codegen/visitor-plugin-common'

export type FixturesVisitorRawConfig = RawTypesConfig & {
  fixtures?: {
    typeDefinitionModule?: string
    scalarDefaults?: Record<string, string>
    immer?: boolean
  }
}

type FixturesVisitorParsedConfig = ParsedTypesConfig & {
  typeDefinitionModule?: string
  scalarDefaults: Record<string, string>
  immer: boolean
}

export class FixturesVisitor extends BaseVisitor<
  FixturesVisitorRawConfig,
  FixturesVisitorParsedConfig
> {
  private scalarMap: { [name: string]: string }

  constructor(schema: GraphQLSchema, config: FixturesVisitorRawConfig) {
    super(config, {
      typeDefinitionModule: config.fixtures?.typeDefinitionModule,
      scalarDefaults: config.fixtures?.scalarDefaults ?? {},
      immer: config.fixtures?.immer ?? false,
    })
    this.scalarMap = typeof config.scalars !== 'string' ? config.scalars ?? {} : {}
  }

  ScalarTypeDefinition(node: ScalarTypeDefinitionNode): string {
    const defaultValue = (() => {
      if (this.config.scalarDefaults[node.name.value]) {
        return this.config.scalarDefaults[node.name.value]
      }
      const scalarAlias = this.scalarMap[node.name.value]
      switch (scalarAlias) {
      case 'string':
        return '\'\''
      case 'number':
        return '0'
      default:
        return '({})'
      }
    })()
    return dedent`
      ${node.name.value}(): ${this.getTypeDefinition('Scalars')}['${node.name.value}'] {
        return ${defaultValue}
      },
    `
  }

  ObjectTypeDefinition(node: ObjectTypeDefinitionNode): string {
    if (['Query', 'Mutation'].includes(node.name.value)) {
      return ''
    }
    return this.generateObjectFixture(node, {
      typename: true,
    })
  }

  InterfaceTypeDefinition(node: InterfaceTypeDefinitionNode): string {
    return this.generateObjectFixture(node, {
      typename: false,
    })
  }

  UnionTypeDefinition(node: UnionTypeDefinitionNode): string | null {
    const firstType = node.types?.[0]
    if (!firstType) {
      return null
    }
    return dedent`
      ${node.name.value}(): ${this.getTypeDefinition(node.name.value)} {
        return ${this.getNamedTypeDefaultValue(firstType)}
      },
    `
  }

  EnumTypeDefinition(node: EnumTypeDefinitionNode): string {
    return dedent`
      ${node.name.value}(): ${this.getTypeDefinition(node.name.value)} {
        return '${node.values?.[0].name.value}' as ${this.getTypeDefinition(node.name.value)}
      },
    `
  }

  InputObjectTypeDefinition(node: InputObjectTypeDefinitionNode): string {
    return this.generateObjectFixture(node, {
      typename: false,
    })
  }

  DirectiveDefinition(): string | null {
    return null
  }

  private generateObjectFixture(node: ObjectDefinitionNodeCompatible, options: {
    typename: boolean,
  }) {
    const fields = node.fields ?? []
    return dedent`
      ${node.name.value}(): ${this.getTypeDefinition(node.name.value)} {
        const fixture: Partial<${this.getTypeDefinition(node.name.value)}> = {
          ${options.typename ? `__typename: '${node.name.value}',` : ''}
        }
        ${fields.map(field => (`Object.defineProperties(fixture, {
          ${field.name.value}: {
            get: () => {
              const self = this as any
              const value = self.__resolved_${field.name.value} ?? ${this.getObjectFieldDefaultValue(field)}
              self.__resolved_${field.name.value} = value
              return value
            }
          },
          __resolved_${field.name.value}: {
            value: undefined,
            writable: true,
          }
        })`)).join('\n        ')}
        return fixture as ${this.getTypeDefinition(node.name.value)}
      },
    `
  }

  private getTypeDefinition(name: string) {
    return this.config.typeDefinitionModule
      ? `types.${this.convertName(name)}`
      : name
  }

  private getObjectFieldDefaultValue(field: FieldDefinitioinNodeCompatible) {
    switch (field.type.kind) {
    case 'NamedType':
      return 'undefined'

    case 'ListType':
      return 'undefined'

    case 'NonNullType':
      if (field.type.type.kind === 'ListType') {
        return '[]'
      } else if (field.type.type.kind === 'NamedType') {
        return this.getNamedTypeDefaultValue(field.type.type)
      } else {
        return null
      }

    default:
      return null
    }
  }

  private getNamedTypeDefaultValue(node: NamedTypeNode) {
    const typeName = node.name.value

    if (this.config.scalarDefaults[typeName]) {
      return this.config.scalarDefaults[typeName]
    }

    switch (typeName) {
    case 'ID':
      return '\'\''

    case 'String':
      return '\'\''

    case 'Int':
      return '0'

    case 'Float':
      return '0'

    case 'Boolean':
      return 'false'

    default:
      return `this.${typeName}()`
    }
  }
}

type ObjectDefinitionNodeCompatible = {
  name: NameNode,
  fields?: ReadonlyArray<FieldDefinitioinNodeCompatible>,
}

type FieldDefinitioinNodeCompatible = {
  name: NameNode
  type: TypeNode
}
