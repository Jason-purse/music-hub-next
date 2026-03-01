'use client'
import { createContext, useContext } from 'react'

export const AdminTokenContext = createContext<string>('')
export const useAdminToken = () => useContext(AdminTokenContext)
