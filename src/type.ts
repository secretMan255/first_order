export enum STATUS {
     GOOD = 1,
     FAIL = 0,
}

export type ItemStatus = {
     status: number
}

export type Credential = {
     username: string
     password: string
}

export type Resp = {
     status: number
     res: string
}

export type Order = {
     item_id: number
     qty: number
}

export type Items = {
     type: number
     name: string
     price: string
     pic: string
}

export type ItemGroup = {
     [key: number]: { name: string; price: string; pic: string }[]
}

export enum ECODE {
     GOOD = 200,
     ERROR = 404,
}
