export const isEmailValid = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

export const isPhoneNumberValid = (phone: string): boolean => {
    const regex = /^\+?[1-9]\d{1,14}$/;
    return regex.test(phone);
};

export const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

export const generateRandomString = (length: number): string => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};