import type { Transaction } from "@parser"

const CACHE_NAME = "statements"

const getStatements = () => {
  const cacheTxsRaw = localStorage.getItem(CACHE_NAME)
  return JSON.parse(cacheTxsRaw) ?? {}
}

const addStatement = (name: string, txs: Transaction[]) => {
  const cacheTxsRaw = localStorage.getItem(CACHE_NAME)
  let newCacheTxs = JSON.parse(cacheTxsRaw)
  newCacheTxs = {
    ...newCacheTxs,
    [name]: txs,
  }
  localStorage.setItem(CACHE_NAME, JSON.stringify(newCacheTxs))
  return newCacheTxs
}

const removeStatement = (name: string) => {
  const cacheTxsRaw = localStorage.getItem(CACHE_NAME)
  const cacheTxs = JSON.parse(cacheTxsRaw)
  const newCacheTxs = Object.fromEntries(
    Object.entries(cacheTxs).filter(([bill]) => bill !== name)
  )
  localStorage.setItem(CACHE_NAME, JSON.stringify(newCacheTxs))

  return newCacheTxs
}

export const cache = {
  addStatement,
  removeStatement,
  getStatements,
}
