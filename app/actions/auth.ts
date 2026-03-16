"use server"

export async function verifyCredentials(user: string, pass: string) {
  const validUser = process.env.ADMIN_USERNAME
  const validPass = process.env.ADMIN_PASSWORD

  if (!validUser || !validPass) return false

  return user === validUser && pass === validPass
}