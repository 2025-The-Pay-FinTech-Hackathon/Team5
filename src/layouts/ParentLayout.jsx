import React from 'react';
import { Outlet } from 'react-router-dom';
import ParentNavigation from '../components/ParentNavigation';
import NotificationCenter from '../components/notifications/NotificationCenter';

const ParentLayout = ({ user, onLogout }) => (
  <>
    <ParentNavigation user={user} onLogout={onLogout} />
    <NotificationCenter />
    <Outlet />
  </>
);

export default ParentLayout; 