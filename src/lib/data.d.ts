export type ListInfo = {
    name: string;
    isPersisted: boolean;
    owner: string;
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
    no: string;
    name: string;
    vote: string;
}