export type RequestPasswordHandler = (
  updatePassword: (password: string) => void
) => void

export type MaxPasswordTriesHandler = () => void

export type PasswordHandler = {
  handleRequestPassword: RequestPasswordHandler
  handleMaxPasswordTries: MaxPasswordTriesHandler
}
