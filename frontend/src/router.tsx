import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import DocumentEditor from './pages/DocumentEditor';
import DocumentCreate from './pages/DocumentCreate';
import ProfilePage from './pages/ProfilePage'; // Добавьте импорт

const AppRouter: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/document/:id" element={<DocumentEditor />} />
        <Route path="/document/new" element={<DocumentCreate />} />
        <Route path="/profile" element={<ProfilePage />} /> {/* Добавьте этот маршрут */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;