import React, { createContext, useState, useContext, useEffect } from 'react';
import { posts as predefinedPosts } from '../data';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allPosts, setAllPosts] = useState([]);
  const [deletedPosts, setDeletedPosts] = useState([]);
  const [resetRequests, setResetRequests] = useState([]);

  useEffect(() => {
    const user = localStorage.getItem('user');

    if (user) {
      setCurrentUser(JSON.parse(user));
    }

    loadDeletedPosts();
    loadResetRequests();

    setAllPosts(predefinedPosts);

    setLoading(false);
  }, []);

  const loadDeletedPosts = () => {
    const deleted = JSON.parse(localStorage.getItem('deletedPosts') || '[]');
    setDeletedPosts(deleted);
  };

  const loadResetRequests = () => {
    const requests = JSON.parse(localStorage.getItem('resetRequests') || '[]');
    setResetRequests(requests);
  };

  const validatePassword = (password) => {
    const errors = [];

    if (password.length < 8) {
      errors.push('At least 8 characters');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('One uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('One lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('One number');
    }

    if (!/[!@#$%^&*]/.test(password)) {
      errors.push('One special character');
    }

    return errors;
  };

  // SIGNUP
  const signup = async (email, password, name) => {
    const passwordErrors = validatePassword(password);

    if (passwordErrors.length > 0) {
      throw new Error(passwordErrors.join(', '));
    }

    const fakeUser = {
      id: Date.now(),
      email,
      name,
      profilePic: ''
    };

    // Save current user
    localStorage.setItem('user', JSON.stringify(fakeUser));
    setCurrentUser(fakeUser);

    // Save users list
    const users = JSON.parse(localStorage.getItem('users') || '[]');

    users.push({
      email,
      password,
      name
    });

    localStorage.setItem('users', JSON.stringify(users));

    return fakeUser;
  };

  // LOGIN
  const login = async (email, password) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');

    const user = users.find(
      (u) => u.email === email && u.password === password
    );

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const loggedInUser = {
      email: user.email,
      name: user.name,
      profilePic: ''
    };

    localStorage.setItem('user', JSON.stringify(loggedInUser));

    setCurrentUser(loggedInUser);

    return loggedInUser;
  };

  // LOGOUT
  const logout = () => {
    localStorage.removeItem('user');
    setCurrentUser(null);
  };

  // FORGOT PASSWORD
  const requestPasswordReset = (email) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');

    const user = users.find((u) => u.email === email);

    if (!user) {
      throw new Error('No account found with this email');
    }

    const resetCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const expiryTime = new Date().getTime() + 15 * 60 * 1000;

    const resetRequest = {
      email,
      code: resetCode,
      expiry: expiryTime,
      used: false
    };

    const existingRequests = JSON.parse(
      localStorage.getItem('resetRequests') || '[]'
    );

    const filteredRequests = existingRequests.filter(
      (req) => req.email !== email
    );

    filteredRequests.push(resetRequest);

    localStorage.setItem(
      'resetRequests',
      JSON.stringify(filteredRequests)
    );

    setResetRequests(filteredRequests);

    alert(
      `Reset Code: ${resetCode}`
    );

    return resetCode;
  };

  // VERIFY RESET CODE
  const verifyResetCode = (email, code) => {
    const requests = JSON.parse(
      localStorage.getItem('resetRequests') || '[]'
    );

    const request = requests.find(
      (req) =>
        req.email === email &&
        req.code === code &&
        !req.used &&
        req.expiry > new Date().getTime()
    );

    if (!request) {
      throw new Error('Invalid or expired reset code');
    }

    return true;
  };

  // RESET PASSWORD
  const resetPassword = (email, code, newPassword) => {
    verifyResetCode(email, code);

    const users = JSON.parse(localStorage.getItem('users') || '[]');

    const userIndex = users.findIndex(
      (u) => u.email === email
    );

    if (userIndex === -1) {
      throw new Error('User not found');
    }

    users[userIndex].password = newPassword;

    localStorage.setItem('users', JSON.stringify(users));

    return true;
  };

  // GET POSTS
  const getPosts = async () => {
    return allPosts;
  };

  // ADD POST
  const addPost = async (post) => {
    const newPost = {
      ...post,
      id: Date.now(),
      author: currentUser?.name || 'Unknown',
      authorEmail: currentUser?.email || '',
      date: new Date().toISOString().split('T')[0],
      likes: 0,
      comments: []
    };

    const updatedPosts = [newPost, ...allPosts];

    setAllPosts(updatedPosts);

    return newPost;
  };

  // DELETE POST
  const deletePost = async (postId) => {
    const postToDelete = allPosts.find(
      (p) => p.id === postId
    );

    if (!postToDelete) return;

    const updatedPosts = allPosts.filter(
      (p) => p.id !== postId
    );

    setAllPosts(updatedPosts);

    const updatedDeletedPosts = [
      postToDelete,
      ...deletedPosts
    ];

    setDeletedPosts(updatedDeletedPosts);

    localStorage.setItem(
      'deletedPosts',
      JSON.stringify(updatedDeletedPosts)
    );
  };

  // RESTORE POST
  const restorePost = (postId) => {
    const post = deletedPosts.find(
      (p) => p.id === postId
    );

    if (!post) return;

    setAllPosts([post, ...allPosts]);

    const updatedDeleted = deletedPosts.filter(
      (p) => p.id !== postId
    );

    setDeletedPosts(updatedDeleted);

    localStorage.setItem(
      'deletedPosts',
      JSON.stringify(updatedDeleted)
    );
  };

  // CLEAR DELETED HISTORY
  const clearDeletedHistory = () => {
    localStorage.setItem('deletedPosts', JSON.stringify([]));
    setDeletedPosts([]);
  };

  // GET USER POSTS
  const getUserPosts = async (userEmail) => {
    return allPosts.filter(
      (post) => post.authorEmail === userEmail
    );
  };

  // GET POST BY ID
  const getPostById = async (postId) => {
    return allPosts.find(
      (post) => post.id === postId
    );
  };

  // UPDATE POST
  const updatePost = (postId, updates) => {
    const updatedPosts = allPosts.map((post) =>
      post.id === postId
        ? { ...post, ...updates }
        : post
    );

    setAllPosts(updatedPosts);
  };

  // GET DELETED POSTS
  const getDeletedPosts = () => {
    return deletedPosts;
  };

  const value = {
    currentUser,
    authToken,
    signup,
    login,
    logout,
    requestPasswordReset,
    verifyResetCode,
    resetPassword,
    addPost,
    deletePost,
    restorePost,
    clearDeletedHistory,
    getPosts,
    getUserPosts,
    getPostById,
    updatePost,
    getDeletedPosts
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};