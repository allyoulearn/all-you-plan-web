import gql from 'graphql-tag'

const USER_FRAGMENT = gql`
  fragment UserFields on User {
    id
    email
    name
    timezone
    briefingTime
    quietHoursStart
    quietHoursEnd
    nudgeFrequency
    preferences {
      theme
      language
      defaultSpaceId
    }
    streak {
      current
      best
      lastCompletionDate
    }
    createdAt
    updatedAt
  }
`

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

export const ME = gql`
  ${USER_FRAGMENT}
  query Me {
    me {
      ...UserFields
    }
  }
`

export const LOGOUT = gql`
  mutation Logout {
    logout
  }
`

export const UPDATE_PROFILE = gql`
  ${USER_FRAGMENT}
  mutation UpdateProfile(
    $name: String
    $timezone: String
    $briefingTime: String
    $quietHoursStart: String
    $quietHoursEnd: String
    $nudgeFrequency: NudgeFrequency
    $theme: Theme
    $language: String
  ) {
    updateProfile(
      name: $name
      timezone: $timezone
      briefingTime: $briefingTime
      quietHoursStart: $quietHoursStart
      quietHoursEnd: $quietHoursEnd
      nudgeFrequency: $nudgeFrequency
      theme: $theme
      language: $language
    ) {
      ...UserFields
    }
  }
`

export const FORGOT_PASSWORD = gql`
  mutation ForgotPassword($email: String!) {
    forgotPassword(email: $email)
  }
`

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

export const GOOGLE_LOGIN = gql`
  ${USER_FRAGMENT}
  mutation GoogleLogin($idToken: String!) {
    googleLogin(idToken: $idToken) {
      accessToken
      user {
        ...UserFields
      }
    }
  }
`
