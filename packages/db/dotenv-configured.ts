import dotenv from 'dotenv'
import path from 'path'

const moduleDirectory = import.meta.dirname

if (typeof moduleDirectory === 'string') {
  dotenv.config({
    path: path.join(moduleDirectory, '.env'),
  })
}
