/** GraphQL operations for notification settings + device management. */
import { gql } from '@apollo/client/core'

export const NOTIFICATION_SETTINGS_QUERY = gql`
  query NotificationSettings {
    notificationSettings {
      pushEnabled
      emailEnabled
      inAppEnabled
      quietHoursEnabled
      quietHoursStart
      quietHoursEnd
      dailyBriefingTime
      permission
      preferences {
        id
        categoryId
        push
        email
        inApp
      }
    }
    notificationDevices {
      id
      label
      platform
      status
      lastSeenAt
      enrolledAt
      current
    }
  }
`

export const UPDATE_NOTIFICATION_SETTINGS = gql`
  mutation UpdateNotificationSettings($input: UpdateNotificationSettingsInput!) {
    updateNotificationSettings(input: $input) {
      pushEnabled
      emailEnabled
      inAppEnabled
      quietHoursEnabled
      quietHoursStart
      quietHoursEnd
      dailyBriefingTime
      permission
    }
  }
`

export const UPDATE_NOTIFICATION_PREFERENCE = gql`
  mutation UpdateNotificationPreference($input: UpdateNotificationPreferenceInput!) {
    updateNotificationPreference(input: $input) {
      id
      categoryId
      push
      email
      inApp
    }
  }
`

export const REGISTER_DEVICE = gql`
  mutation RegisterDevice($label: String!, $platform: DevicePlatform!, $token: String!) {
    registerDevice(label: $label, platform: $platform, token: $token) {
      id
      label
      platform
    }
  }
`

export const REVOKE_DEVICE = gql`
  mutation RevokeDevice($id: ID!) {
    revokeDevice(id: $id)
  }
`
