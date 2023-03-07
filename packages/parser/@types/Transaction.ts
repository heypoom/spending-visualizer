export interface Transaction {
  /**
   * Date when the transaction was first made.
   *
   * @todo parse this into JS date.
   **/
  transactionDate: Date

  /**
   * Date when the payment went through.
   *
   * @todo parse this into JS date.
   **/
  paymentDate: Date

  // TODO: parse into a more deterministic format.
  // for example, description here could mean a lot of different things.
  // TODO: to document the variations.
  description: string
  desciption2?: string
  desciption3?: string

  /** Amount in THB */
  amount: number

  /** Amount in USD */
  amountInUSD?: number

  usdRate?: number
}
