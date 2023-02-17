export const GET_LIST_OF_MESSAGE = (groupId: string) => {
  return `/open/v5/groups/${groupId}/messages`
}

export const SEND_MESSAGE = (groupId: string) => {
  return `/open/v5/groups/${groupId}/messages`
}
