// src/utils/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// 부모 ID로 자녀 목록 조회
export const fetchChildrenByParent = (parentId) =>
  API.get(`/children/parent/${parentId}`);


// 자녀 추가 API
export const createChild = async (childData) => {
  return await API.post('/children', childData);
};

// utils/api.js
export const sendAllowance = (childId, amount) =>
  API.post(`/children/${childId}/allowance`, { amount });

// utils/api.js
export const fetchChildById = (childId) => API.get(`/children/${childId}`);

// 자녀 삭제
// 자녀 삭제
export const deleteChild = (childId) => {
  return API.delete(`/children/${childId}`);
};



export default API;
