import {RoomInfo} from "./databases";

export type UpdateType = "add" | "update" | "remove";
export type ListenerType = "list" | "room";
export type ListEvent = {
    type: UpdateType,
    id: string,
    room: RoomInfo | null
}
export type RoomEvent = {
    type: UpdateType,
    id: string,
    room: RoomInfo
}
export type EventListener<T> = (event: T) => void