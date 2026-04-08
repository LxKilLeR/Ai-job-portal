import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();
const API_BASE = import.meta.env.VITE_API_URL || '';

const requireApiBase = () => {
  if (!API_BASE) {
    console.warn('VITE_API_URL is not configured. Falling back to a relative /api path.');
  }
  return API_BASE;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('ai_jobs_user');
    const storedToken = localStorage.getItem('token');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      if (!parsedUser.token && storedToken) {
        parsedUser.token = storedToken;
      }
      setUser(parsedUser);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await fetch(`${requireApiBase()}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        const user = {
          id: data.user.id || 'u1',
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          company: data.user.company,
          location: data.user.location,
          phone: data.user.phone,
          bio: data.user.bio,
          avatar: data.user.avatar,
          searchingFor: data.user.searchingFor,
          profession: data.user.profession,
          skills: data.user.skills,
          address: data.user.address,
          profileCompleted: data.user.profileCompleted,
          token: data.token,
        };
        setUser(user);
        localStorage.setItem('token', data.token);
        localStorage.setItem('ai_jobs_user', JSON.stringify(user));
        return { success: true, user };
      }
      return { success: false, message: data.message || 'Login failed' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const loginWithGoogle = async (googleToken, role) => {
    try {
      const res = await fetch(`${requireApiBase()}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: googleToken, role }),
      });
      const data = await res.json();
      if (data.success) {
        const user = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          company: data.user.company,
          location: data.user.location,
          phone: data.user.phone,
          bio: data.user.bio,
          avatar: data.user.avatar,
          searchingFor: data.user.searchingFor,
          profession: data.user.profession,
          skills: data.user.skills,
          address: data.user.address,
          profileCompleted: data.user.profileCompleted,
          token: data.token,
        };
        setUser(user);
        localStorage.setItem('token', data.token);
        localStorage.setItem('ai_jobs_user', JSON.stringify(user));
        return { success: true, user };
      }
      return { success: false, message: data.message || 'Google login failed' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const signup = async (data) => {
    const mockUser = {
      id: 'u2',
      name: data.name,
      email: data.email,
      role: data.role || 'Seeker',
      avatar: `https://ui-avatars.com/api/?name=${data.name}&background=4F6EF7&color=fff`
    };
    setUser(mockUser);
    localStorage.setItem('ai_jobs_user', JSON.stringify(mockUser));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ai_jobs_user');
    localStorage.removeItem('token');
  };

  // Method to directly set auth (used by OTP flow)
  const setAuth = (token, userData) => {
    const user = {
      id: userData.id || userData._id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      company: userData.company,
      location: userData.location,
      phone: userData.phone,
      bio: userData.bio,
      avatar: userData.avatar,
      searchingFor: userData.searchingFor,
      profession: userData.profession,
      skills: userData.skills,
      address: userData.address,
      profileCompleted: userData.profileCompleted,
      token
    };
    setUser(user);
    localStorage.setItem('token', token);
    localStorage.setItem('ai_jobs_user', JSON.stringify(user));
  };

  const updateUser = (partialUser) => {
    setUser((prev) => {
      const next = { ...(prev || {}), ...partialUser };
      localStorage.setItem('ai_jobs_user', JSON.stringify(next));
      if (next.token) {
        localStorage.setItem('token', next.token);
      }
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, signup, logout, setAuth, updateUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
