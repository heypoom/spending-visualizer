export interface Transaction {
  /**
   * Date when the transaction was first made.
   *
   * @todo parse this into JS date.
   **/
  transactionDate: Date;

  /** Date when the payment went through. **/
  paymentDate: Date;

  // TODO: parse into a more deterministic format.
  // for example, description here could mean a lot of different things.
  // TODO: to document the variations.
  description: string;
  description2?: string;
  description3?: string;

  /** Amount in THB */
  amount: number;

  /** Amount in foreign currency e.g. USD, THB, JPY */
  foreignCurrencyAmount?: number;

  conversionRate?: number;

  /** deposit or withdrawal, for bank statement */
  type?: "deposit" | "withdrawal";
}
