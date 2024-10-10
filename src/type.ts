export enum STATUS {
  GOOD = 1,
  FAIL = 0,
}

export type ItemStatus = {
  status: number
}

export type Resp = {
  status: number
  res: string
}

export enum ECODE {
  GOOD = 200,
  ERROR = 404,
}
