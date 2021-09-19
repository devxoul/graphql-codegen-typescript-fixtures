import setup from './setup'
import { downloadFile, execAsync } from './utils'

export default async () => {
  await clean()
  await buildPlugin()
  await makeDirectories()
  await downloadSchema()
  await generateFixturesForTyping()
  await generateFixturesForTypingWithImmer()
}

const clean = async () => {
  await execAsync('yarn clean')
}

const buildPlugin = async () => {
  await execAsync('yarn build')
}

const makeDirectories = async () => {
  await execAsync(`mkdir -p ./tests/schema`)
  await execAsync(`mkdir -p ./tests/generated`)
}


const downloadSchema = async () => {
  const url = 'https://docs.github.com/public/schema.docs.graphql'
  const destination = './tests/schema/github.schema.graphql'
  await downloadFile(url, destination)
}

const generateFixturesForTyping = async () => {
  await setup({
    suffix: 'for-typing',
    ignoreErrors: true,
  })
}

const generateFixturesForTypingWithImmer = async () => {
  await setup({
    suffix: 'for-typing-with-immer',
    ignoreErrors: true,
    fixtureConfig: {
      immer: true,
    },
  })
}
