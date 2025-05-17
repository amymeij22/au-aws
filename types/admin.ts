export interface Admin {
  id: string
  username: string
  fullName: string
  role: 'admin'
  lastLogin?: string
  password?: string
}

export interface LoginCredentials {
  username: string
  password: string
}
