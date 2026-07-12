import { apiRequest } from './client'
import type { LoginResponse, MeResponse, SignupResponse } from '../types/auth'

export interface SignupPayload {
  fullName: string
  email: string
  password: string
}

export interface LoginPayload {
  email: string
  password: string
}

export function signupRequest(payload: SignupPayload): Promise<SignupResponse> {
  return apiRequest<SignupResponse>('/api/auth/signup', {
    method: 'POST',
    body: payload,
  })
}

export function loginRequest(payload: LoginPayload): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: payload,
  })
}

export function meRequest(token: string): Promise<MeResponse> {
  return apiRequest<MeResponse>('/api/auth/me', {
    method: 'GET',
    token,
  })
}
