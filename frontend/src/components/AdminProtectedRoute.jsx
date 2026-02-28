import { Navigate } from 'react-router-dom';

const AdminProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('hopehug_admin_token');
    const user = JSON.parse(localStorage.getItem('hopehug_admin_user') || '{}');

    if (!token || user.role !== 'admin') {
        return <Navigate to="/rohitadmin" replace />;
    }

    return children;
};

export default AdminProtectedRoute;
