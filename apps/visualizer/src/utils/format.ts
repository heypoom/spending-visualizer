export const formatNumber = (
  num: number | bigint,
  minDigits = 2,
  maxDigits = minDigits
): string => {
  if (Number.isNaN(num)) return " - "
  const { format } = Intl.NumberFormat("th-TH", {
    maximumFractionDigits: minDigits,
    minimumFractionDigits: maxDigits,
  })
  return format(num)
}
