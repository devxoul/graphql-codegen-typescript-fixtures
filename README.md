# graphql-codegen-typescript-fixtures

A plugin for [graphql-code-generator](https://www.graphql-code-generator.com/) that generates TypeScript fixtures for testing.

## At a Glance

```tsx
import fixture from './generated/graphql-fixtures.ts'

const user = fixture('User')
user.name // ""
user.followers.totalCount // 0

// with Immer.js
const repo = fixture('Repository', repo => {
  repo.name = 'my-cool-stuff'
  repo.stargazerCount = 1234
})
repo.name // "my-cool-stuff"
repo.stargazerCount // 1234
```

## Features

* 🍭 Strongly typed.

    <img width="500" alt="type-hints" src="https://user-images.githubusercontent.com/931655/133975704-fbd99da0-d6b3-4155-a1f1-5f18f327c0ca.png">

* 🧬 Built-in support for [Immer](https://github.com/immerjs/immer) integration.

    <img width="500" alt="immer" src="https://user-images.githubusercontent.com/931655/133975969-941f5b54-308f-4e1e-a6c7-8b2166f0b8bc.png">

## Installation

* Using Yarn:
  ```console
  $ yarn add @pocketlesson/graphql-codegen-typescript-fixtures --dev
  ```
* Using npm:
  ```console
  $ npm install @pocketlesson/graphql-codegen-typescript-fixtures --dev
  ```

Add lines below in your graphql-codegen configuration file. Check out [Configuration](Configuration) section for more details.

```diff
  generates:
    src/generated/graphql.ts:
      plugins:
        - "typescript"
        - "typescript-operations"
+   src/generated/graphql-fixtures.ts:
+     plugins:
+       - "@pocketlesson/graphql-codegen-typescript-fixtures"

  config:
    scalars:
      Date: string
      DateTime: string
+   fixtures:
+     typeDefinitionModule: "path/to/graphql/types.ts"
```

## Configuration

### typeDefinitionModule

*(Required)* A path for the GraphQL type definition module. This value is used to import the GraphQL type definitions.

For example:

```yaml
config:
  fixtures:
    typeDefinitionModule: "@src/generated/graphql"
```

And the generated code will be:

```ts
// src/generated/graphql-fixtures.ts
import * as types from '@src/generated/graphql'
```

### immer

*(Optional)* Whether to generate [Immer](https://github.com/immerjs/immer) integration.

For example:

```yaml
config:
  fixtures:
    immer: true
```

Then the second parameter of `fixture()` will become available.

```ts
fixture('User', user => {
  user.name = 'Suyeol Jeon'
})
```

### scalarDefaults

*(Optional)* The default values of scalar types. Note that the values are directly written to the TypeScript code so you need to wrap strings with quotes properly.

For example:

```yaml
config:
  fixtures:
    scalarDefaults:
      Date: "'2021-01-01'"
      DateTime: "'2021-01-01T00:00:00+00:00'"
      Timestamp: 1609426800
```

## License

This project is under MIT license. See the [LICENSE](LICENSE) file for more info.
