import gql from 'graphql-tag'

export const TASK_FRAGMENT = gql`
  fragment TaskFields on Task {
    id
    spaceId
    title
    description
    quadrant
    status
    dueDate
    effort
    subtasks {
      id
      title
      completed
    }
    recurrence {
      type
      daysOfWeek
      interval
      dayOfMonth
      nthWeekday {
        week
        day
      }
    }
    snoozedUntil
    completedAt
    order
    suggestedQuadrant
    suggestedReason
    createdAt
    updatedAt
  }
`

export const GET_TASKS = gql`
  ${TASK_FRAGMENT}
  query GetTasks($spaceId: ID, $quadrant: String, $status: String) {
    tasks(spaceId: $spaceId, quadrant: $quadrant, status: $status) {
      ...TaskFields
    }
  }
`

export const GET_TASK = gql`
  ${TASK_FRAGMENT}
  query GetTask($id: ID!) {
    task(id: $id) {
      ...TaskFields
    }
  }
`

export const GET_TASKS_DUE_TODAY = gql`
  ${TASK_FRAGMENT}
  query GetTasksDueToday {
    tasksDueToday {
      ...TaskFields
    }
  }
`

export const GET_OVERDUE_TASKS = gql`
  ${TASK_FRAGMENT}
  query GetOverdueTasks {
    overdueTasks {
      ...TaskFields
    }
  }
`

export const GET_EISENHOWER_MATRIX = gql`
  ${TASK_FRAGMENT}
  query GetEisenhowerMatrix {
    eisenhowerMatrix {
      do {
        ...TaskFields
      }
      schedule {
        ...TaskFields
      }
      delegate {
        ...TaskFields
      }
      drop {
        ...TaskFields
      }
    }
  }
`

export const CREATE_TASK = gql`
  ${TASK_FRAGMENT}
  mutation CreateTask(
    $spaceId: ID!
    $title: String!
    $description: String
    $quadrant: String
    $dueDate: String
    $effort: String
    $recurrence: RecurrenceInput
    $subtasks: [SubtaskInput]
  ) {
    createTask(
      spaceId: $spaceId
      title: $title
      description: $description
      quadrant: $quadrant
      dueDate: $dueDate
      effort: $effort
      recurrence: $recurrence
      subtasks: $subtasks
    ) {
      ...TaskFields
    }
  }
`

export const UPDATE_TASK = gql`
  ${TASK_FRAGMENT}
  mutation UpdateTask(
    $id: ID!
    $title: String
    $description: String
    $quadrant: String
    $status: String
    $dueDate: String
    $effort: String
    $snoozedUntil: String
    $order: Int
  ) {
    updateTask(
      id: $id
      title: $title
      description: $description
      quadrant: $quadrant
      status: $status
      dueDate: $dueDate
      effort: $effort
      snoozedUntil: $snoozedUntil
      order: $order
    ) {
      ...TaskFields
    }
  }
`

export const COMPLETE_TASK = gql`
  ${TASK_FRAGMENT}
  mutation CompleteTask($id: ID!) {
    completeTask(id: $id) {
      completed {
        ...TaskFields
      }
      nextInstance {
        ...TaskFields
      }
    }
  }
`

export const DELETE_TASK = gql`
  mutation DeleteTask($id: ID!) {
    deleteTask(id: $id)
  }
`

export const COMPLETE_SUBTASK = gql`
  ${TASK_FRAGMENT}
  mutation CompleteSubtask($taskId: ID!, $subtaskId: ID!, $completed: Boolean!) {
    completeSubtask(taskId: $taskId, subtaskId: $subtaskId, completed: $completed) {
      ...TaskFields
    }
  }
`

export const ADD_SUBTASK = gql`
  ${TASK_FRAGMENT}
  mutation AddSubtask($taskId: ID!, $title: String!) {
    addSubtask(taskId: $taskId, title: $title) {
      ...TaskFields
    }
  }
`

export const SNOOZE_TASK = gql`
  ${TASK_FRAGMENT}
  mutation SnoozeTask($id: ID!, $until: String!) {
    snoozeTask(id: $id, until: $until) {
      ...TaskFields
    }
  }
`

export const TASK_UPDATED_SUBSCRIPTION = gql`
  ${TASK_FRAGMENT}
  subscription TaskUpdated($userId: ID!) {
    taskUpdated(userId: $userId) {
      ...TaskFields
    }
  }
`

export const TASK_COMPLETED_SUBSCRIPTION = gql`
  ${TASK_FRAGMENT}
  subscription TaskCompleted($userId: ID!) {
    taskCompleted(userId: $userId) {
      completed {
        ...TaskFields
      }
      nextInstance {
        ...TaskFields
      }
    }
  }
`
