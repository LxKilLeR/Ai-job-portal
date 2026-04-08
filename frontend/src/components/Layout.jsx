import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import ChatWidget from './ChatWidget';

export default function Layout() {
  return (
    <div className="min-h-screen bg-mesh selection:bg-indigo-primary/30">
      <Navbar />
      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <Outlet />
      </main>
      <ChatWidget />
    </div>
  );
}
