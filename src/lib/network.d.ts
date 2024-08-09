import {ListInfo} from "./data";

export type ListenerType = "list" | "room"
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
