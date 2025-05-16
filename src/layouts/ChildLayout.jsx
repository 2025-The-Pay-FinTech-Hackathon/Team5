import React from 'react';
import { Outlet } from 'react-router-dom';
import ChildNavigation from '../components/ChildNavigation';
import NotificationCenter from '../components/notifications/NotificationCenter';

const ChildLayout = ({ user, onLogout }) => (
  <>
    <ChildNavigation user={user} onLogout={onLogout} />
    <NotificationCenter />
    <Outlet />
  </>
);

export default ChildLayout; 