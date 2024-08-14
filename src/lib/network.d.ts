import {CardSet, RoomInfo, UserInfo} from "./data";

export type ListenerType = "list" | "room" | "user" | "sets" | "tasks"
export type EventTypes = ListEvent | RoomEvent | SetsEvent
export type CrudAction = "add" | "update" | "remove"
export type ListEvent = {
    action: CrudAction,
    id: string,
    evt: RoomInfo
}
export type RoomEvent = {
    evt: {
        room?: RoomInfo,
        user?: {
            id: string;
            name?: string;
            moderator?: boolean;
            vote?: string | undefined;
        },
        task?: {
            action: CrudAction,
            id: string,
            evt: {
                no?: string;
                name?: string;
                comments?: string;
                vote?: string;
            }
        }
    }
}
export type SetsEvent = {
    action: CrudAction,
    id: string,
    evt: CardSet
}
type EventData<T extends ListenerType> =
    T extends "room" ? {
            user: {
                name: string
            },
            roomId: string,
            action: CrudAction,
        }
    : boolean
export type WebSocketRegisteringEvent<T extends ListenerType> = {
    type: T,
    userId: string,
    data: EventData<T>
}

export type NetCallback =
    ((evt: ListEvent) => void) |
    ((evt: SetsEvent) => void) |
    ((evt: RoomEvent) => void)
