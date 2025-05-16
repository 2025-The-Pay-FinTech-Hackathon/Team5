import React, { createContext, useContext } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const FirestoreContext = createContext();

export const useFirestore = () => {
  return useContext(FirestoreContext);
};

export const FirestoreProvider = ({ children }) => {
  const getLoans = async (userId) => {
    try {
      const loansRef = collection(db, 'loans');
      const q = query(loansRef, where('childId', '==', userId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting loans:', error);
      throw error;
    }
  };

  const addLoan = async (loanData) => {
    try {
      const loansRef = collection(db, 'loans');
      await addDoc(loansRef, loanData);
    } catch (error) {
      console.error('Error adding loan:', error);
      throw error;
    }
  };

  const updateLoan = async (loanId, updateData) => {
    try {
      const loanRef = doc(db, 'loans', loanId);
      await updateDoc(loanRef, updateData);
    } catch (error) {
      console.error('Error updating loan:', error);
      throw error;
    }
  };

  const getMessages = async (userId1, userId2) => {
    try {
      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        where('participants', 'array-contains', [userId1, userId2].sort().join('_')),
        orderBy('timestamp', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  };

  const sendMessage = async (message) => {
    try {
      const messagesRef = collection(db, 'messages');
      const participants = [message.sender, message.receiver].sort().join('_');
      await addDoc(messagesRef, {
        ...message,
        participants,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  const getUsers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  };

  const value = {
    getLoans,
    addLoan,
    updateLoan,
    getMessages,
    sendMessage,
    getUsers,
  };

  return (
    <FirestoreContext.Provider value={value}>
      {children}
    </FirestoreContext.Provider>
  );
}; 