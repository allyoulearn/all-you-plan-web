/**
 * GraphQL operations for authentication and the user profile.
 *
 * Queries / mutations: LOGIN, REGISTER, REFRESH_TOKEN, ME, LOGOUT,
 * UPDATE_PROFILE, FORGOT_PASSWORD, RESET_PASSWORD. All session-bearing
 * mutations return the auth payload `{ accessToken, user }` and share the
 * `UserFields` fragment so the cached user shape stays consistent across
 * operations (WEB-W1-12).
 */
import { gql } from '@apollo/client/core'

/** Shared user shape; keep in sync with `auth.store.setAuth` consumers. */
const USER_FRAGMENT = gql`
  fragment UserFields on User {
    id
    email
    name
    timezone
    streak {
      current
      best
      lastCompletionDate
    }
    settings {
      theme
      mode
      density
      coachPersonality
      checkIns
      stalledNudgeDays
      journalVisibility
    }
  }
`

/** Sign in with email + password; returns `{ accessToken, user }`. */
export const LOGIN = gql`
  ${USER_FRAGMENT}
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      accessToken
      user {
        ...UserFields
      }
    }
  }
`

/** Create a new account; auto-issues a session like LOGIN. */
export const REGISTER = gql`
  ${USER_FRAGMENT}
  mutation Register($email: String!, $password: String!, $name: String!) {
    register(email: $email, password: $password, name: $name) {
      accessToken
      user {
        ...UserFields
      }
    }
  }
`

/** Exchange the HTTP-only refresh cookie for a fresh access token. */
export const REFRESH_TOKEN = gql`
  ${USER_FRAGMENT}
  mutation RefreshToken {
    refreshToken {
      accessToken
      user {
        ...UserFields
      }
    }
  }
`

/** Re-fetch the current user (used by views that need fresh profile state). */
export const ME = gql`
  ${USER_FRAGMENT}
  query Me {
    me {
      ...UserFields
    }
  }
`

/** Invalidate the refresh cookie server-side. */
export const LOGOUT = gql`
  mutation Logout {
    logout
  }
`

/** Update profile fields and/or merged settings; returns the new user. */
export const UPDATE_PROFILE = gql`
  ${USER_FRAGMENT}
  mutation UpdateProfile($name: String, $timezone: String, $settings: UpdateSettingsInput) {
    updateProfile(name: $name, timezone: $timezone, settings: $settings) {
      ...UserFields
    }
  }
`

/** Request a password-reset email; resolves boolean regardless of email existence. */
export const FORGOT_PASSWORD = gql`
  mutation ForgotPassword($email: String!) {
    forgotPassword(email: $email)
  }
`

/** Apply a new password using the one-time token from email; returns a session. */
export const RESET_PASSWORD = gql`
  ${USER_FRAGMENT}
  mutation ResetPassword($token: String!, $newPassword: String!) {
    resetPassword(token: $token, newPassword: $newPassword) {
      accessToken
      user {
        ...UserFields
      }
    }
  }
`
