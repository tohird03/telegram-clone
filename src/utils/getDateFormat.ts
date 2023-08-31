import dayjs from "dayjs";

export const getFullDate = (date: string) => dayjs(date).format('HH:mm:ss DD-MM-YYYY')
