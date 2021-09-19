import { exec } from 'child_process'
import fs from 'fs'
import https from 'https'

export const execAsync = async (command: string) => {
  return new Promise<void>((resolve, reject) => {
    exec(command, (error) => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })
}

export const downloadFile = async (url: string, destination: string) => {
  const file = fs.createWriteStream(destination)
  return new Promise<void>((resolve) => {
    https.get(url, (response) => {
      response.pipe(file)
      resolve()
    })
  })
}

export const writeFileAsync = async (path: string, data: string) => {
  return new Promise<void>((resolve, reject) => {
    fs.writeFile(path, data, (error) => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })
}

export const getRandomString = () => {
  return Math.random().toString(36).substr(2, 5)
}
