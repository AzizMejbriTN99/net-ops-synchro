const TOKEN_KEY = 'access_token';

export const setAccessToken = (token) => {
    localStorage.setItem(TOKEN_KEY, token);
};

export const getAccessToken = () => {
    return localStorage.getItem(TOKEN_KEY);
};

export const clearAccessToken = () => {
    localStorage.removeItem(TOKEN_KEY);
};