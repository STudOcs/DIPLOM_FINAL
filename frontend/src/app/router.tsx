import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import Dashboard from '../pages/dashboard/Dashboard';
import DocumentCreate from '../pages/document-create/DocumentCreate';
import DocumentEditor from '../pages/document-editor/DocumentEditor';
import ProfilePage from '../pages/profile/ProfilePage';
import { ProtectedRoute } from './providers/ProtectedRoute';

// src/app/router.tsx
export const router = createBrowserRouter([
    {
        path: '/login',
        element: <LoginPage />,
    },
    {
        path: '/register',
        element: <RegisterPage />,
    },
    {
        // Все роуты внутри этой группы требуют токена
        element: <ProtectedRoute />,
        children: [
            { path: '/dashboard', element: <Dashboard /> },
            { path: '/profile', element: <ProfilePage /> },
            { path: '/editor/:id', element: <DocumentEditor /> },
            { path: '/create', element: <DocumentCreate /> },
        ]
    },
    { path: '*', element: <Navigate to="/dashboard" /> }
]);