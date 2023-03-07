import {Transaction} from './Transaction'

export type StatementParser = (input: string[][]) => Transaction[]
