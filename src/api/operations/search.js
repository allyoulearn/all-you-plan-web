/** GraphQL operations for global search (Cmd+K palette + mobile search tab). */
import { gql } from '@apollo/client/core'

export const SEARCH_QUERY = gql`
  query Search($query: String!, $limit: Int) {
    search(query: $query, limit: $limit) {
      query
      recent
      tasks {
        id
        kind
        title
        snippet
        when
        projectTag
        href
      }
      projects {
        id
        kind
        title
        snippet
        when
        projectTag
        href
      }
      chores {
        id
        kind
        title
        snippet
        when
        projectTag
        href
      }
      inbox {
        id
        kind
        title
        snippet
        when
        projectTag
        href
      }
      journal {
        id
        kind
        title
        snippet
        when
        projectTag
        href
      }
      calendar {
        id
        kind
        title
        snippet
        when
        projectTag
        href
      }
      wren {
        id
        kind
        title
        snippet
        when
        projectTag
        href
      }
    }
  }
`

export const RECORD_SEARCH_QUERY = gql`
  mutation RecordSearchQuery($query: String!) {
    recordSearchQuery(query: $query)
  }
`
