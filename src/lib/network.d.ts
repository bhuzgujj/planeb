import {ListInfo} from "./data";

export type ListenerType = "list" | "room" | "user"
export type CrudAction = "add" | "update" | "remove"

export type ListEvent = {
    action: CrudAction,
    id: string,
    evt: ListInfo
}
export type RoomModificationEvent = {
    id: string,
    evt: ListInfo
}
export type UserEvent = {
    action: CrudAction,
    id: string,
    evt: {
        name?: string | undefined;
        vote?: string | undefined;
    }
}
export type UserJoinEvent = {
    user: {
        id: string,
        name: string
    },
    id: string
}
export type WebSocketRequest = {
    listed?: boolean,
    focused?: UserJoinEvent,
    unfocused?: string,
    userId?: string,
    type: ListenerType
}
