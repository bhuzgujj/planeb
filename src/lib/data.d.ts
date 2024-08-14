export type RoomInfo = {
    name: string;
    isPersisted: boolean;
    owner: string;
    taskRegex?: string;
}
export type Room = {
    id: string,
    users: UserInfo[],
    tasks: TaskInfo[],
    cards: Card[],
    roomInfo: RoomInfo
}
export type UserInfo = {
    id: string;
    name: string;
    moderator: boolean;
    vote: string | undefined;
}
export type DbUser = {
    id: string;
    names: string;
    moderator: number;
}
export type TaskInfo = {
    id: string;
    no?: string;
    name: string;
    comments?: string;
    vote?: string;
}
export type Task = {
    name: string,
    no?: string
}
export type CardSet = {
    name: string;
    cards: Array<Card>
}

export type Card = {
    id: string,
    value: number,
    label: string
}

export type Query = "init" | "create_room"
