import gql from 'graphql-tag'

export const SPACE_FRAGMENT = gql`
  fragment SpaceFields on Space {
    id
    name
    icon
    color
    order
    archived
    taskCount
    createdAt
    updatedAt
  }
`

export const GET_SPACES = gql`
  ${SPACE_FRAGMENT}
  query GetSpaces {
    spaces {
      ...SpaceFields
    }
  }
`

export const GET_SPACE = gql`
  ${SPACE_FRAGMENT}
  query GetSpace($id: ID!) {
    space(id: $id) {
      ...SpaceFields
    }
  }
`

export const CREATE_SPACE = gql`
  ${SPACE_FRAGMENT}
  mutation CreateSpace($name: String!, $icon: String, $color: String) {
    createSpace(name: $name, icon: $icon, color: $color) {
      ...SpaceFields
    }
  }
`

export const UPDATE_SPACE = gql`
  ${SPACE_FRAGMENT}
  mutation UpdateSpace(
    $id: ID!
    $name: String
    $icon: String
    $color: String
    $order: Int
  ) {
    updateSpace(id: $id, name: $name, icon: $icon, color: $color, order: $order) {
      ...SpaceFields
    }
  }
`

export const ARCHIVE_SPACE = gql`
  ${SPACE_FRAGMENT}
  mutation ArchiveSpace($id: ID!) {
    archiveSpace(id: $id) {
      ...SpaceFields
    }
  }
`
