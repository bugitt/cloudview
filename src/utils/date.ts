import moment from "moment/moment";

export function formatTimeStamp(timestamp: number | undefined | null): string {
    if (!timestamp || timestamp <= 0 || timestamp === 0) {
        return "";
    }
    return moment(timestamp).format('YYYY-MM-DD HH:mm:ss')
}
