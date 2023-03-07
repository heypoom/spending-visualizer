/**
 * Parse DD/MM/YYYY into date
 **/
export const parseDate = (dateString: string): Date =>
  new Date(
    Date.parse(dateString.replace(/(\d{2})\/(\d{2})\/(\d{2})/, '20$3-$2-$1'))
  )
