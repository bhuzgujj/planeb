import {CardSet, RoomInfo} from "./data";

export type ListenerType = "list" | "room" | "sets"
export type MessageType = "votes" | "result"
export type EventTypes = ListEvent | RoomEvent | SetsEvent
export type CrudAction = "add" | "update" | "remove"
export type Vote = {
    roomId: string,
    card: string,
    userId: string,
    tasksId: string,
}
export type AcceptedVote = {
    roomId: string,
    card: string,
    tasksId: string,
}
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
            evt?: {
                no?: string;
                name?: string;
                comments?: string;
                vote?: string;
            }
        },
        voting?: {
            taskId: string,
            voted?: {
                [id: string]: string
            },
            show?: boolean
        }
    }
}
export type SetsEvent = {
    action: CrudAction,
    id: string,
    evt: CardSet
}
type EventData<T extends ListenerType | MessageType> =
    T extends "room" ? {
            user: {
                name: string
            },
            roomId: string,
            action: CrudAction,
        }
    : T extends "votes" ? {
        taskId: string,
        roomId: string,
    }
    : T extends "result" ? {
        taskId: string,
        roomId: string,
    }
    : boolean
export type WebSocketRegisteringEvent<T extends ListenerType> = {
    type: T,
    userId: string,
    data: EventData<T>
}
export type WebSocketMessageEvent<T extends ListenerType | MessageType> = {
    type: T,
    userId: string,
    data: EventData<T>
}

export type NetCallback =
    ((evt: ListEvent) => void) |
    ((evt: SetsEvent) => void) |
    ((evt: RoomEvent) => void)
