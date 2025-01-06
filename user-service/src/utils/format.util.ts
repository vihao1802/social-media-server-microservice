
export class Formater {
    static formatDate = (date: Date): string => {
        const day = String(date.getDate()).padStart(2, '0'); // Lấy ngày, thêm số 0 nếu cần
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Tháng bắt đầu từ 0
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    };
}