import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_BASE = '/api';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('hopehug_token');
        const storedUser = localStorage.getItem('hopehug_user');
        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
            axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
        const { token: t, user: u } = res.data;
        setToken(t);
        setUser(u);
        localStorage.setItem('hopehug_token', t);
        localStorage.setItem('hopehug_user', JSON.stringify(u));
        axios.defaults.headers.common['Authorization'] = `Bearer ${t}`;
        return u;
    };

    const register = async (name, email, password, role) => {
        const res = await axios.post(`${API_BASE}/auth/register`, { name, email, password, role });
        const { token: t, user: u } = res.data;
        setToken(t);
        setUser(u);
        localStorage.setItem('hopehug_token', t);
        localStorage.setItem('hopehug_user', JSON.stringify(u));
        axios.defaults.headers.common['Authorization'] = `Bearer ${t}`;
        return u;
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('hopehug_token');
        localStorage.removeItem('hopehug_user');
        delete axios.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
