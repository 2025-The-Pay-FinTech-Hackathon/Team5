import React from 'react';
import { Outlet } from 'react-router-dom';
import ParentNavigation from '../components/ParentNavigation';

const ParentLayout = ({ user, onLogout }) => (
  <>
    <ParentNavigation user={user} onLogout={onLogout} />
    <Outlet />
  </>
);

export default ParentLayout; 
